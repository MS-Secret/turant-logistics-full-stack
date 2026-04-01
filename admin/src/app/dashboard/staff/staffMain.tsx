'use client'
import React, { useEffect, useState } from 'react'
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2,
  Phone,
  Mail,
  Briefcase,
  Building,
  Calendar
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import StaffService from '@/services/staff'
import StaffModal from '@/components/modals/StaffModal';

interface StaffMember {
  _id: string;
  name?: string;
  employeeId: string;
  department: string;
  designation: string;
  contactDetails?: {
    alternateEmail?: string;
    officialPhone?: string;
  };
  salary?: {
    total: number;
    basic: number;
    allowances: number;
  };
  joiningDate: string;
  isActive: boolean;
}

const StaffMain = () => {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  const handleGetStaff = async () => {
    setLoading(true);
    try {
      const response = await StaffService.GetStaffList();
      if (response?.status === 200) {
        setStaffList(response.data?.data || []);
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
      toast.error("Failed to load staff list");
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteStaff = async (staffId: string, employeeId: string) => {
    if (confirm(`Are you sure you want to completely remove staff member ${employeeId}?`)) {
      try {
        const response = await StaffService.DeleteStaff(staffId);
        if (response?.status === 200) {
          toast.success("Staff member removed");
          handleGetStaff();
        } else {
          toast.error("Failed to delete staff");
        }
      } catch (error) {
        console.error("Delete error:", error);
        toast.error("An error occurred");
      }
    }
  }

  const handleModalSubmit = async (data: any) => {
    try {
      if (editingStaff) {
        // Update
        const response = await StaffService.UpdateStaff(editingStaff._id, data);
        if (response?.status === 200) {
          toast.success("Staff details updated");
        }
      } else {
        // Create
        const response = await StaffService.CreateStaff(data);
        if (response?.status === 201) {
          toast.success("New staff added successfully");
        }
      }
      setIsModalOpen(false);
      setEditingStaff(null);
      handleGetStaff();
    } catch (error) {
      console.error("Save error:", error);
      toast.error("An error occurred while saving");
    }
  }

  useEffect(() => {
    handleGetStaff();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-600 mt-1">Onboard and manage Turant Logistics internal staff members</p>
        </div>
        <button 
          onClick={() => {
            setEditingStaff(null);
            setIsModalOpen(true);
          }}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Staff</p>
              <p className="text-2xl font-bold text-gray-900">{staffList.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Departments</p>
              <p className="text-2xl font-bold text-indigo-600">
                {new Set(staffList.map(s => s.department)).size}
              </p>
            </div>
            <Building className="w-8 h-8 text-indigo-500" />
          </div>
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
          </div>
        ) : staffList.length === 0 ? (
          <div className="col-span-3 text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-lg font-medium">No staff members found.</p>
            <p className="text-gray-400 text-sm mt-1">Click 'Add Staff' to start onboarding your team.</p>
          </div>
        ) : (
          staffList.map((staff) => (
            <div key={staff._id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-100 to-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-200 text-lg">
                    {staff.department ? staff.department.charAt(0).toUpperCase() : "S"}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{staff.designation}</h3>
                    <p className="text-sm font-medium text-blue-600">{staff.employeeId}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Building className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-800">{staff.department}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{staff.contactDetails?.alternateEmail || "No Email"}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{staff.contactDetails?.officialPhone || "No Phone"}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
                <span className="text-xs text-gray-500 flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  Joined {new Date(staff.joiningDate).toLocaleDateString()}
                </span>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => {
                      setEditingStaff(staff);
                      setIsModalOpen(true);
                    }} 
                    className="text-gray-500 hover:text-blue-600 p-1.5 rounded bg-gray-50 hover:bg-blue-50 transition-colors"
                    title="Edit Staff"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteStaff(staff._id, staff.employeeId)} 
                    className="text-gray-500 hover:text-red-600 p-1.5 rounded bg-gray-50 hover:bg-red-50 transition-colors"
                    title="Remove Staff"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <StaffModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingStaff(null);
        }} 
        onSubmit={handleModalSubmit}
        initialData={editingStaff}
      />
    </div>
  )
}

export default StaffMain
