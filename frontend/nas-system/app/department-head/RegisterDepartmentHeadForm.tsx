import React, { useState, useEffect } from "react";
import { departmentHeadService } from "@/services/departmentHeadService";

export default function RegisterDepartmentHeadForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    idNumber: "",
    password: "",
    departmentCode: "",
  });
  const [departments, setDepartments] = useState<{ _id: string; departmentCode: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDepartments() {
      try {
        const data = await departmentHeadService.getDepartments();
        setDepartments(data);
      } catch (err) {
        setError("Failed to load departments.");
      }
    }
    fetchDepartments();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    setError("");
    
    // Frontend validation
    const namePattern = /^[a-zA-Z\s'-]+$/;
    if (!namePattern.test(form.name.trim()) || form.name.trim().length === 0) {
      setError("Please enter a valid name. Only letters, spaces, hyphens, and apostrophes are allowed.");
      setLoading(false);
      return;
    }
    
    const idNumberPattern = /^\d{2}-\d{4}-\d{3}$/;
    if (!idNumberPattern.test(form.idNumber)) {
      setError("Invalid ID number format. Please use: DD-DDDD-DDD (e.g., 22-6729-813)");
      setLoading(false);
      return;
    }
    
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters long");
      setLoading(false);
      return;
    }
    
    try {
      await departmentHeadService.registerDepartmentHead(form);
      setSuccess("Department Head registered successfully! Account is ready to use - no email verification needed.");
      setForm({ name: "", email: "", idNumber: "", password: "", departmentCode: "" });
    } catch (err: any) {
      setError(err?.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 bg-white rounded shadow space-y-4">
      <h2 className="text-xl font-bold mb-2">Register Department Head</h2>
      {success && <div className="text-green-600">{success}</div>}
      {error && <div className="text-red-600">{error}</div>}
      <div>
        <label className="block mb-1 font-medium">Name</label>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
          required
          placeholder="e.g., John Doe"
          title="Only letters, spaces, hyphens, and apostrophes allowed"
        />
        <p className="text-xs text-gray-500 mt-1">Only letters, spaces, hyphens, and apostrophes allowed</p>
      </div>
      <div>
        <label className="block mb-1 font-medium">Email</label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
          required
          placeholder="e.g., john.doe@cit.edu"
        />
      </div>
      <div>
        <label className="block mb-1 font-medium">ID Number</label>
        <input
          type="text"
          name="idNumber"
          value={form.idNumber}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
          required
          placeholder="e.g., 22-6729-813"
          pattern="\d{2}-\d{4}-\d{3}"
          title="Format: DD-DDDD-DDD"
        />
        <p className="text-xs text-gray-500 mt-1">Format: DD-DDDD-DDD (e.g., 22-6729-813)</p>
      </div>
      <div>
        <label className="block mb-1 font-medium">Password</label>
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
          required
          placeholder="Min 8 characters"
          minLength={8}
        />
        <p className="text-xs text-gray-500 mt-1">Min 8 characters with uppercase, lowercase, number, and special character</p>
      </div>
      <div>
        <label className="block mb-1 font-medium">Department</label>
        <select
          name="departmentCode"
          value={form.departmentCode}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
          required
          title="Select department"
        >
          <option value="">Select a department</option>
          {departments.map((dept) => (
            <option key={dept.departmentCode} value={dept.departmentCode}>
              {dept.name} ({dept.departmentCode})
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="w-full bg-[#800000] text-white py-2 rounded hover:bg-[#600000]"
        disabled={loading}
      >
        {loading ? "Registering..." : "Register Department Head"}
      </button>
    </form>
  );
} 