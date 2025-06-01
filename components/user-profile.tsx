"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Check } from "lucide-react"

export function UserProfile() {
  const { profile, updateProfile, signOut } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    first_name: profile?.first_name || "",
    last_name: profile?.last_name || "",
    primary_instrument: profile?.primary_instrument || "",
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleInstrumentChange = (value: string) => {
    setFormData((prev) => ({ ...prev, primary_instrument: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const { error } = await updateProfile({
        first_name: formData.first_name,
        last_name: formData.last_name,
        full_name: `${formData.first_name} ${formData.last_name}`.trim(),
        primary_instrument: formData.primary_instrument,
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess("Profile updated successfully")
        setIsEditing(false)
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  if (!profile) {
    return <div>Loading profile...</div>
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Your Profile</CardTitle>
        <CardDescription>Manage your account information</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
            <Check className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input id="first_name" name="first_name" value={formData.first_name} onChange={handleChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input id="last_name" name="last_name" value={formData.last_name} onChange={handleChange} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={profile.email} disabled className="bg-gray-100" />
              <p className="text-sm text-gray-500">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="primary_instrument">Primary Instrument</Label>
              <Select value={formData.primary_instrument || ""} onValueChange={handleInstrumentChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your primary instrument" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="guitar">Guitar</SelectItem>
                  <SelectItem value="piano">Piano</SelectItem>
                  <SelectItem value="violin">Violin</SelectItem>
                  <SelectItem value="drums">Drums</SelectItem>
                  <SelectItem value="vocals">Vocals</SelectItem>
                  <SelectItem value="bass">Bass</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-gray-500">First Name</Label>
                <p>{profile.first_name || "Not set"}</p>
              </div>

              <div>
                <Label className="text-sm text-gray-500">Last Name</Label>
                <p>{profile.last_name || "Not set"}</p>
              </div>
            </div>

            <div>
              <Label className="text-sm text-gray-500">Email</Label>
              <p>{profile.email}</p>
            </div>

            <div>
              <Label className="text-sm text-gray-500">Primary Instrument</Label>
              <p>
                {profile.primary_instrument
                  ? profile.primary_instrument.charAt(0).toUpperCase() + profile.primary_instrument.slice(1)
                  : "Not set"}
              </p>
            </div>

            <div className="pt-4">
              <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-sm text-gray-500">Member since {new Date(profile.created_at).toLocaleDateString()}</p>
        <Button variant="outline" onClick={signOut}>
          Sign Out
        </Button>
      </CardFooter>
    </Card>
  )
}
