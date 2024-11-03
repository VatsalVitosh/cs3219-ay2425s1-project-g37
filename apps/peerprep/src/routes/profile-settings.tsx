import { Avatar } from "@peerprep/ui/avatar";
import { Button } from "@peerprep/ui/button";
import { Input } from "@peerprep/ui/text-input";
import { useAuth, useUpdateUser } from "@peerprep/utils/client";
import { UserPen } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

function Form() {
  const { data: user } = useAuth();
  if (!user) throw new Error("invariant: user is undefined");

  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { isMutating, trigger } = useUpdateUser(user.id);

  const isDifferent = username !== user.username || email !== user.email || password;

  return (
    <form
      className="bg-main-900 flex w-full max-w-lg flex-col gap-6 p-9"
      onSubmit={async e => {
        e.preventDefault();
        if (password && password !== confirmPassword) {
          toast.error("Passwords do not match!");
          return;
        }
        await trigger({ username, email, password: password || undefined });
        toast.success("Profile updated successfully!");
      }}
    >
      <Input
        label="Username"
        type="text"
        required
        pattern="^[a-zA-Z0-9_]{4,32}$"
        value={username}
        onValueChange={setUsername}
        helpText="Only letters, numbers, and underscores are allowed. Must be between 4 and 32 characters."
      />
      <Input label="Email" type="email" required value={email} onValueChange={setEmail} />
      <Input
        label="Password"
        type="password"
        minLength={8}
        maxLength={128}
        value={password}
        onValueChange={setPassword}
        placeholder="Leave blank to keep current password"
        helpText={<>Password must be between 8-128 characters long.</>}
      />
      {password ? (
        <Input
          label="Confirm Password"
          type="password"
          pattern={password}
          value={confirmPassword}
          onValueChange={setConfirmPassword}
        />
      ) : null}
      <div className="flex flex-row justify-end">
        <Button
          className="w-auto"
          type="submit"
          variants={{ variant: "primary" }}
          disabled={isMutating || !isDifferent}
        >
          <UserPen />
          {isMutating ? "Updating..." : "Update Profile"}
        </Button>
      </div>
    </form>
  );
}

export default function ProfileSettingsPage() {
  const { data: user } = useAuth();
  if (!user) return null;

  return (
    <main className="flex flex-row justify-center gap-6">
      <div className="flex w-full max-w-72 flex-col gap-6">
        <h1 className="text-main-50 text-2xl">Profile Settings</h1>
        <div className="flex flex-row items-center gap-6">
          <Avatar imageUrl={user.imageUrl} username={user.username} className="size-16 shrink-0" />
          <div className="flex min-w-0 flex-col">
            <div className="text-main-50 truncate text-lg">@{user.username}</div>
            <div className="text-main-500 truncate">{user.email}</div>
            <div className="text-main-500 mt-1.5 text-xs">
              Member since {user.createdAt.toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
      <Form />
    </main>
  );
}
