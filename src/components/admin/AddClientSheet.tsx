"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";

export function AddClientSheet({ onClientAdded }: { onClientAdded?: (client: unknown) => void }) {
  const router = useRouter();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [pinEnabled, setPinEnabled] = useState(false);
  const [employeesList, setEmployeesList] = useState<{ id: string; name: string }[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    pin: "",
    projectName: "",
    projectDescription: "",
    projectRenderCount: "",
    projectDeadline: "",
    projectEmployees: [] as string[],
  });

  useEffect(() => {
    async function loadEmployees() {
      try {
        const res = await fetch("/api/employees");
        if (res.ok) {
          const data = await res.json();
          setEmployeesList(data);
        }
      } catch (e) {
        console.error("Failed to load employees:", e);
      }
    }
    if (isSheetOpen) {
      loadEmployees();
    }
  }, [isSheetOpen]);

  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };


  const handleSaveClient = async () => {
    if (!formData.name || !formData.contactPerson || !formData.email) {
      alert("Please fill in all required fields.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          contactPerson: formData.contactPerson,
          email: formData.email,
          phone: formData.phone,
          logoUrl: "",
          projectName: formData.projectName,
          projectDescription: formData.projectDescription,
          projectRenderCount: formData.projectRenderCount,
          projectDeadline: formData.projectDeadline,
          projectEmployees: formData.projectEmployees,
        }),
      });

      if (res.ok) {
        const createdClient = await res.json();
        if (onClientAdded) onClientAdded(createdClient);
        router.refresh(); // Re-fetch server component data
        
        setFormData({ 
          name: "", contactPerson: "", email: "", phone: "", pin: "", 
          projectName: "", projectDescription: "", projectRenderCount: "", projectDeadline: "", projectEmployees: [] 
        });
        setPinEnabled(false);
        setIsSheetOpen(false);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save client to the database.");
      }
    } catch (e) {
      console.error("Error saving client:", e);
      alert("An error occurred while saving the client.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <SheetTrigger render={<Button className="bg-primary text-primary-foreground hover:bg-primary/90" />}>
        <Plus className="mr-2 h-4 w-4" /> Add Client
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add Client</SheetTitle>
          <SheetDescription>
            Create a new client profile. A unique public link will be generated automatically.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 py-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Client Name *</label>
            <Input name="name" value={formData.name} onChange={handleInputChange} placeholder="Enter client name" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Contact Person *</label>
            <Input name="contactPerson" value={formData.contactPerson} onChange={handleInputChange} placeholder="Enter contact name" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email *</label>
            <Input name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="Enter email address" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Phone</label>
            <Input name="phone" type="tel" value={formData.phone} onChange={handleInputChange} placeholder="Enter phone number" />
          </div>
          <div className="space-y-2 pt-2">
            <label className="flex items-center space-x-2 text-sm font-medium cursor-pointer">
              <input 
                type="checkbox" 
                className="rounded border-border text-primary focus:ring-primary"
                checked={pinEnabled}
                onChange={(e) => setPinEnabled(e.target.checked)}
              />
              <span>Enable PIN Protection</span>
            </label>
          </div>
          {pinEnabled && (
            <div className="space-y-2 pt-2">
              <label className="text-sm font-medium">Client PIN Code</label>
              <Input name="pin" type="text" value={formData.pin} onChange={handleInputChange} placeholder="e.g. 1234" maxLength={6} className="font-mono" />
            </div>
          )}

          <div className="border-t border-border pt-6 mt-6">
            <h3 className="text-base font-bold mb-4">Initial Project Details</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Project Name</label>
                <Input name="projectName" value={formData.projectName} onChange={handleInputChange} placeholder="e.g. Spring Collection 2026" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input name="projectDescription" value={formData.projectDescription} onChange={handleInputChange} placeholder="Brief description (optional)" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Total Renders</label>
                  <Input name="projectRenderCount" type="number" value={formData.projectRenderCount} onChange={handleInputChange} placeholder="e.g. 10" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Deadline</label>
                  <Input name="projectDeadline" type="date" value={formData.projectDeadline} onChange={handleInputChange} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Assign Employees</label>
                <div className="space-y-1 p-2 border border-border rounded-md max-h-48 overflow-y-auto bg-card">
                  {employeesList.length === 0 ? (
                    <div className="text-sm text-muted-foreground italic p-2">No employees found.</div>
                  ) : (
                    employeesList.map(emp => (
                      <label key={emp.id} className="flex items-center space-x-3 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors">
                        <input
                          type="checkbox"
                          className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                          checked={formData.projectEmployees.includes(emp.name)}
                          onChange={() => {
                            setFormData(prev => {
                              const current = prev.projectEmployees;
                              if (current.includes(emp.name)) {
                                return { ...prev, projectEmployees: current.filter(n => n !== emp.name) };
                              } else {
                                return { ...prev, projectEmployees: [...current, emp.name] };
                              }
                            });
                          }}
                        />
                        <span className="text-sm font-medium text-foreground">{emp.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsSheetOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveClient} disabled={isSaving}>
              {isSaving ? "Saving Client..." : "Save Client"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
