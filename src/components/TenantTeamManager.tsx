import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Mail, Trash2, Shield, UserCog, User } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { useUser } from "@/hooks/useUser"

interface TeamMember {
  id: string
  user_id: string
  role: string
  email: string
  name: string
}

export function TenantTeamManager() {
  const { companyId } = useUser()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("analyst")
  const [isInviting, setIsInviting] = useState(false)

  useEffect(() => {
    if (companyId) {
      fetchMembers()
    }
  }, [companyId])

  const fetchMembers = async () => {
    try {
      const res = await fetch(`/api/v1/team?companyId=${companyId}`)
      if (res.ok) {
        const data = await res.json()
        setMembers(data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail || !companyId) return
    setIsInviting(true)
    try {
      const res = await fetch('/api/v1/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole, companyId })
      })
      
      if (res.ok) {
        const data = await res.json()
        setMembers([...members, data])
        setInviteEmail("")
        toast.success(`Invite sent to ${inviteEmail}`)
      } else {
        toast.error("Failed to send invite")
      }
    } catch (err) {
      toast.error("Error inviting user")
    } finally {
      setIsInviting(false)
    }
  }

  const handleRoleChange = async (id: string, newRole: string) => {
    try {
      const res = await fetch('/api/v1/team', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, role: newRole })
      })
      if (res.ok) {
        toast.success("Role updated")
        fetchMembers()
      }
    } catch (err) {
      toast.error("Failed to update role")
    }
  }

  const handleRemove = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/team?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success("User removed from organization")
        fetchMembers()
      }
    } catch (err) {
      toast.error("Failed to remove user")
    }
  }

  const getRoleIcon = (role: string) => {
    switch(role) {
      case 'owner': return <Shield className="h-3.5 w-3.5 text-rose-500" />
      case 'compliance_officer': return <Shield className="h-3.5 w-3.5 text-indigo-500" />
      case 'analyst': return <UserCog className="h-3.5 w-3.5 text-blue-500" />
      default: return <User className="h-3.5 w-3.5 text-slate-500" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          Team Management
        </h3>
        <p className="text-xs text-muted-foreground">
          Invite users and manage Role-Based Access Control (RBAC) permissions across your organization.
        </p>
      </div>

      <div className="flex items-end gap-3 rounded-lg border border-border/60 bg-muted/20 p-4">
        <div className="flex-1 space-y-1.5">
          <Label className="text-xs">Email Address</Label>
          <Input 
            type="email"
            placeholder="colleague@bank.com" 
            value={inviteEmail} 
            onChange={(e) => setInviteEmail(e.target.value)}
            className="h-9 text-xs bg-background"
          />
        </div>
        <div className="w-48 space-y-1.5">
          <Label className="text-xs">Role Assignment</Label>
          <Select value={inviteRole} onValueChange={setInviteRole}>
            <SelectTrigger className="h-9 text-xs bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="viewer">Viewer</SelectItem>
              <SelectItem value="analyst">Analyst</SelectItem>
              <SelectItem value="compliance_officer">Compliance Officer</SelectItem>
              <SelectItem value="owner">Owner</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleInvite} disabled={!inviteEmail || isInviting} className="h-9 text-xs gap-1.5">
          <Mail className="h-3.5 w-3.5" /> Send Invite
        </Button>
      </div>

      <div className="rounded-lg border border-border/60 bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="text-xs">User</TableHead>
              <TableHead className="text-xs">Role</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-xs text-muted-foreground py-6">
                  No team members found.
                </TableCell>
              </TableRow>
            ) : (
              members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium">{member.name}</span>
                      <span className="text-[0.65rem] text-muted-foreground">{member.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select value={member.role} onValueChange={(v) => handleRoleChange(member.id, v)}>
                      <SelectTrigger className="h-7 w-40 text-[0.7rem] bg-transparent border-transparent hover:border-border transition-colors">
                        <div className="flex items-center gap-2">
                          {getRoleIcon(member.role)}
                          <span className="uppercase tracking-wider font-semibold">{member.role.replace('_', ' ')}</span>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">Viewer</SelectItem>
                        <SelectItem value="analyst">Analyst</SelectItem>
                        <SelectItem value="compliance_officer">Compliance Officer</SelectItem>
                        <SelectItem value="owner">Owner</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleRemove(member.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
