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
    try {
      await departmentHeadService.registerDepartmentHead(form);
      setSuccess("Department Head registered successfully!");
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
          placeholder="Enter full name"
        />
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
          placeholder="Enter email address"
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
          placeholder="Enter ID number"
        />
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
          placeholder="Enter password"
        />
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