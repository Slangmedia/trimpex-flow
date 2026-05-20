"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load from API on mount
  useEffect(() => {
    async function loadEmployees() {
      try {
        const res = await fetch("/api/employees");
        if (res.ok) {
          const data = await res.json();
          setEmployees(data);
        }
      } catch (e) {
        console.error("Failed to fetch employees", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadEmployees();
  }, []);

  const handleDeleteEmployee = async (id: string) => {
    if (confirm("Are you sure you want to delete this employee? This will delete all their assigned data permanently!")) {
      try {
        const res = await fetch(`/api/employees/${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setEmployees(employees.filter((emp) => emp.id !== id));
        } else {
          alert("Failed to delete employee from database.");
        }
      } catch (e) {
        console.error("Error deleting employee:", e);
        alert("An error occurred while deleting the employee.");
      }
    }
  };

  return (
    <div className="p-5 space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground mt-1">Manage 3D artists and team members.</p>
        </div>

        <Link href="/admin/employees/new">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" /> Add Employee
          </Button>
        </Link>
      </div>

      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead className="text-center">Projects Assigned</TableHead>
              <TableHead className="text-center">Active Renders</TableHead>
              <TableHead>Joined Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-4 w-28 bg-muted rounded animate-pulse" />
                        <div className="h-3 w-36 bg-muted rounded animate-pulse" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center"><div className="h-4 w-8 bg-muted rounded animate-pulse mx-auto" /></TableCell>
                  <TableCell className="text-center"><div className="h-4 w-8 bg-muted rounded animate-pulse mx-auto" /></TableCell>
                  <TableCell><div className="h-4 w-20 bg-muted rounded animate-pulse" /></TableCell>
                  <TableCell className="text-right"><div className="h-8 w-16 bg-muted rounded animate-pulse ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  No employees found in the database.
                </TableCell>
              </TableRow>
            ) : (
              employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={employee.avatarUrl} />
                        <AvatarFallback className="bg-accent text-accent-foreground font-medium">
                          {employee.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{employee.name}</span>
                        <span className="text-xs text-muted-foreground">{employee.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{employee.projectsAssigned}</TableCell>
                  <TableCell className="text-center">{employee.activeRenders}</TableCell>
                  <TableCell className="text-muted-foreground">{employee.joinedDate}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/employees/${employee.id}/edit`}>
                        <Button variant="ghost" size="icon" className="hover:text-primary">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteEmployee(employee.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
