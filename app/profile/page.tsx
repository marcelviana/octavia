import { UserProfile } from "@/components/user-profile"

export default function ProfilePage() {
  return (
    <div className="p-6 space-y-6 bg-[#fff9f0] min-h-screen">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-600">Manage your profile and preferences</p>
      </div>

      <UserProfile />
    </div>
  )
}
