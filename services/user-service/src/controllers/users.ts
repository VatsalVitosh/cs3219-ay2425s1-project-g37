import { Prisma, db } from "@peerprep/db";
import { env } from "@peerprep/env";
import type { NewUser, UpdateUser, User } from "@peerprep/schemas";
import { ExpectedError, decorateUser } from "@peerprep/utils/server";
import { StatusCodes } from "http-status-codes";

export async function createUser({ adminSignUpToken, ...user }: NewUser) {
  if (user.isAdmin && adminSignUpToken !== env.ADMIN_SIGNUP_TOKEN)
    throw new ExpectedError("Invalid admin sign up token", StatusCodes.UNAUTHORIZED);
  try {
    user.email = user.email.trim().toLowerCase();
    const hash = await Bun.password.hash(user.password);
    const { id } = await db.user.create({ data: { ...user, password: hash } });
    return id;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
      throw new ExpectedError("Username or email already exists", StatusCodes.CONFLICT);
    throw error;
  }
}

export async function getUser(id: string): Promise<User> {
  const user = await db.user.findUnique({ where: { id } });
  if (!user) throw new ExpectedError(`User ${id} not found`, StatusCodes.NOT_FOUND);
  return decorateUser(user);
}

export async function getAllUsers(excludeAdmins = false): Promise<User[]> {
  const users = await db.user.findMany({ where: { isAdmin: excludeAdmins ? false : undefined } });
  return users.map(decorateUser);
}

export async function updateUser(id: string, user: UpdateUser) {
  try {
    if (user.email) user.email = user.email.trim().toLowerCase();
    if (user.password) user.password = await Bun.password.hash(user.password);
    await db.user.update({ where: { id }, data: user });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
      throw new ExpectedError("Username or email already exists", StatusCodes.CONFLICT);
    throw error;
  }
}

export async function updateUserPrivilege(id: string, isAdmin: boolean) {
  await db.user.update({ where: { id }, data: { isAdmin } });
}

export async function deleteUser(id: string) {
  const user = await db.user.delete({ where: { id } });
  if (!user) throw new ExpectedError(`User ${id} not found`, StatusCodes.NOT_FOUND);
}

export async function getMatchingHistory(userId: string) {
  try {
    const rooms = await db.room.findMany({
      where: {
        userIds: { has: userId },
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        users: true,
        question: true,
      },
    });
    const data = await rooms;
    console.log(data);
    return rooms.map(room => ({
      roomId: room.id,
      questionTitle: room.question.title,
      questionDifficulty: room.question.difficulty,
      participants: room.users.map(user => user.username),
      createdAt: room.createdAt,
    }));
  } catch (error) {
    throw new Error("Failed to fetch matching history");
  }
}