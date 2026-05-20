"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Briefcase, Search, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function NewProjectPage() {
  const router = useRouter();
  const [clientsList, setClientsList] = useState<any[]>([]);
  const [employeesList, setEmployeesList] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Searchable client dropdown state
  const [clientSearch, setClientSearch] = useState("");
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const clientDropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    totalRenders: "",
    deadline: "",
    clientId: "",
    clientName: "",
    employees: [] as string[],
  });

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(e.target as Node)) {
        setIsClientDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    async function loadMetadata() {
      try {
        const [clientsRes, employeesRes] = await Promise.all([
          fetch("/api/clients"),
          fetch("/api/employees"),
        ]);
        if (clientsRes.ok) {
          const data = await clientsRes.json();
          setClientsList(data);
          if (data.length > 0) {
            setFormData((prev) => ({ ...prev, clientId: data[0].id, clientName: data[0].name }));
          }
        }
        if (employeesRes.ok) {
          setEmployeesList(await employeesRes.json());
        }
      } catch (e) {
        console.error("Failed to load form data", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadMetadata();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectClient = (client: any) => {
    setFormData({ ...formData, clientId: client.id, clientName: client.name });
    setClientSearch("");
    setIsClientDropdownOpen(false);
  };

  const toggleEmployee = (empId: string) => {
    setFormData((prev) => ({
      ...prev,
      employees: prev.employees.includes(empId)
        ? prev.employees.filter((id) => id !== empId)
        : [...prev.employees, empId],
    }));
  };

  const toggleAllEmployees = () => {
    if (formData.employees.length === employeesList.length) {
      setFormData((prev) => ({ ...prev, employees: [] }));
    } else {
      setFormData((prev) => ({ ...prev, employees: employeesList.map((e) => e.id) }));
    }
  };

  const filteredClients = clientsList.filter((c) =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.clientId) {
      alert("Please fill in the required fields (Project Name & Client).");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          totalRenders: formData.totalRenders,
          deadline: formData.deadline,
          clientId: formData.clientId,
          employees: formData.employees,
        }),
      });

      if (res.ok) {
        const newProj = await res.json();
        router.push(`/admin/projects/${newProj.id}`);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create project.");
      }
    } catch (err) {
      console.error("Error creating project:", err);
      alert("An error occurred while saving the project.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-5 w-full">
      {/* Breadcrumb */}
      <Link
        href="/admin/projects"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Projects
      </Link>

      {/* Page Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Briefcase className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add New Project</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Create a new rendering project and assign a team.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <form onSubmit={handleSaveProject}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

            {/* LEFT COLUMN — Project Details */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                Project Details
              </h2>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Project Name <span className="text-destructive">*</span>
                </label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Modern Villa Renders"
                  required
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter project details, scope, or notes..."
                  rows={5}
                  className="flex w-full rounded-xl border border-input bg-transparent px-3 py-2.5 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                />
              </div>

              {/* Searchable Client Dropdown */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Select Client <span className="text-destructive">*</span>
                </label>
                <div className="relative" ref={clientDropdownRef}>
                  {/* Trigger button */}
                  <button
                    type="button"
                    onClick={() => setIsClientDropdownOpen((prev) => !prev)}
                    className="flex h-11 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                  >
                    <span className={formData.clientName ? "text-foreground" : "text-muted-foreground"}>
                      {formData.clientName || "Select a client..."}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isClientDropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  {/* Dropdown panel */}
                  {isClientDropdownOpen && (
                    <div className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-xl shadow-lg overflow-hidden">
                      {/* Search input inside dropdown */}
                      <div className="p-2 border-b border-border">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <input
                            type="text"
                            placeholder="Search clients..."
                            value={clientSearch}
                            onChange={(e) => setClientSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-sm bg-muted/50 rounded-lg border-0 focus:outline-none focus:ring-1 focus:ring-ring"
                            autoFocus
                          />
                        </div>
                      </div>
                      {/* Client list */}
                      <div className="max-h-48 overflow-y-auto py-1">
                        {filteredClients.length === 0 ? (
                          <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                            No clients found.
                          </div>
                        ) : (
                          filteredClients.map((client) => (
                            <button
                              key={client.id}
                              type="button"
                              onClick={() => handleSelectClient(client)}
                              className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-muted/60 transition-colors text-left"
                            >
                              <span>{client.name}</span>
                              {formData.clientId === client.id && (
                                <Check className="h-4 w-4 text-primary" />
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN — Schedule & Team */}
            <div className="space-y-6">
              {/* Schedule Card */}
              <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                  Schedule & Scope
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Total Renders</label>
                    <Input
                      name="totalRenders"
                      type="number"
                      value={formData.totalRenders}
                      onChange={handleInputChange}
                      placeholder="e.g. 10"
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Deadline</label>
                    <Input
                      name="deadline"
                      type="date"
                      value={formData.deadline}
                      onChange={handleInputChange}
                      className="h-11 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Team Card — Checkboxes */}
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                    Assign Team
                  </h2>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {formData.employees.length} selected
                  </span>
                </div>

                {/* Select All row */}
                <label className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/70 cursor-pointer transition-colors border border-border">
                  <input
                    type="checkbox"
                    checked={formData.employees.length === employeesList.length && employeesList.length > 0}
                    onChange={toggleAllEmployees}
                    className="w-4 h-4 rounded accent-primary cursor-pointer"
                  />
                  <span className="text-sm font-semibold text-foreground">Select All</span>
                </label>

                {/* Individual employees */}
                <div className="space-y-2">
                  {employeesList.map((emp) => (
                    <label
                      key={emp.id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/40 cursor-pointer transition-colors group"
                    >
                      <input
                        type="checkbox"
                        checked={formData.employees.includes(emp.id)}
                        onChange={() => toggleEmployee(emp.id)}
                        className="w-4 h-4 rounded accent-primary cursor-pointer"
                      />
                      <div className="flex items-center gap-2.5 flex-1">
                        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-bold uppercase flex-shrink-0">
                          {emp.name?.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">{emp.name}</div>
                          {emp.email && (
                            <div className="text-[11px] text-muted-foreground">{emp.email}</div>
                          )}
                        </div>
                      </div>
                      {formData.employees.includes(emp.id) && (
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                    </label>
                  ))}
                  {employeesList.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No employees found.</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/admin/projects")}
                  className="rounded-xl h-11 px-6"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl h-11 px-8 font-semibold"
                >
                  {isSaving ? "Creating..." : (
                    <><Plus className="mr-2 h-4 w-4" /> Create Project</>
                  )}
                </Button>
              </div>
            </div>

          </div>
        </form>
      )}
    </div>
  );
}
