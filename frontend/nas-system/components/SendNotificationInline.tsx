'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Users, User, Search, Bell, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

interface UserOption {
  _id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
  idNumber?: string;
  role?: string | { _id: string; name: string };
}

interface SendNotificationInlineProps {
  isExpanded: boolean;
  onToggle: () => void;
}

const NOTIFICATION_TYPES = [
  { value: 'general', label: 'General Announcement' },
  { value: 'application_status', label: 'Application Status Update' },
  { value: 'document_status', label: 'Document Status Update' },
  { value: 'interview_scheduled', label: 'Interview Scheduled' },
  { value: 'progress_update', label: 'Progress Update' },
  { value: 'status_change', label: 'Status Change' },
];

const ITEMS_PER_PAGE = 20;

export default function SendNotificationInline({ isExpanded, onToggle }: SendNotificationInlineProps) {
  const [loading, setLoading] = useState(false);
  const [sendMode, setSendMode] = useState<'single' | 'bulk'>('single');
  const [users, setUsers] = useState<UserOption[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserOption[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Lazy loading state for single user mode
  const [singleDisplayCount, setSingleDisplayCount] = useState(ITEMS_PER_PAGE);
  const [loadingMoreSingle, setLoadingMoreSingle] = useState(false);
  const singleListRef = useRef<HTMLDivElement>(null);
  
  // Lazy loading state for bulk mode
  const [bulkDisplayCount, setBulkDisplayCount] = useState(ITEMS_PER_PAGE);
  const [loadingMoreBulk, setLoadingMoreBulk] = useState(false);
  const bulkListRef = useRef<HTMLDivElement>(null);
  
  // Form data
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [notificationType, setNotificationType] = useState<string>('general');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  
  // Results
  const [sentCount, setSentCount] = useState(0);
  const [lastSentTime, setLastSentTime] = useState<Date | null>(null);
  
  const { toast } = useToast();

  // Reset display counts when search term changes
  useEffect(() => {
    setSingleDisplayCount(ITEMS_PER_PAGE);
  }, [searchTerm]);

  // Reset bulk display count when role changes
  useEffect(() => {
    setBulkDisplayCount(ITEMS_PER_PAGE);
  }, [selectedRole]);

  // Load users when component expands
  useEffect(() => {
    if (isExpanded) {
      loadUsers();
    }
  }, [isExpanded]);

  // Filter users based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
      return;
    }
    
    const search = searchTerm.toLowerCase();
    const filtered = users.filter(user => {
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
      const name = (user.name || '').toLowerCase();
      const email = (user.email || '').toLowerCase();
      const idNumber = (user.idNumber || '').toLowerCase();
      
      return fullName.includes(search) || 
             name.includes(search) || 
             email.includes(search) || 
             idNumber.includes(search);
    });
    
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await axios.get(`${API_URL}/users`, {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' },
      });
      
      const usersData = response.data?.users || response.data?.data || response.data || [];
      setUsers(Array.isArray(usersData) ? usersData : []);
      setFilteredUsers(Array.isArray(usersData) ? usersData : []);
    } catch (error: any) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSendSingle = async () => {
    if (!selectedUser || !title.trim() || !message.trim()) {
      toast({
        title: "Validation Error",
        description: "Please select a user and fill in the title and message",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/notifications`, {
        userId: selectedUser,
        type: notificationType,
        title: title.trim(),
        message: message.trim(),
        priority: 'medium',
        metadata: {}
      }, {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' },
      });

      const user = users.find(u => u._id === selectedUser);
      const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : 'User';

      toast({
        title: "Notification Sent",
        description: `Notification sent to ${userName} successfully`
      });

      setSentCount(prev => prev + 1);
      setLastSentTime(new Date());
      
      // Reset form
      setTitle('');
      setMessage('');
      setSelectedUser('');
    } catch (error: any) {
      console.error('Error sending notification:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to send notification",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendBulk = async () => {
    if (!title.trim() || !message.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in the title and message",
        variant: "destructive"
      });
      return;
    }

    // Filter users by role if not "all"
    const targetUsers = selectedRole === 'all' 
      ? users 
      : users.filter(u => getRoleName(u.role) === selectedRole);

    if (targetUsers.length === 0) {
      toast({
        title: "No Recipients",
        description: "No users found matching the selected criteria",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      // Send notifications in parallel batches
      const batchSize = 10;
      for (let i = 0; i < targetUsers.length; i += batchSize) {
        const batch = targetUsers.slice(i, i + batchSize);
        
        const promises = batch.map(user => 
          axios.post(`${API_URL}/notifications`, {
            userId: user._id,
            type: notificationType,
            title: title.trim(),
            message: message.trim(),
            priority: 'medium',
            metadata: {}
          }, {
            withCredentials: true,
            headers: { 'Content-Type': 'application/json' },
          }).then(() => { successCount++; })
            .catch(() => { failCount++; })
        );
        
        await Promise.all(promises);
      }

      toast({
        title: "Bulk Send Complete",
        description: `Sent ${successCount} notifications successfully${failCount > 0 ? `, ${failCount} failed` : ''}`
      });

      setSentCount(prev => prev + successCount);
      setLastSentTime(new Date());
      
      // Reset form
      setTitle('');
      setMessage('');
    } catch (error: any) {
      console.error('Error sending bulk notifications:', error);
      toast({
        title: "Error",
        description: "Failed to send bulk notifications",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getUserDisplayName = (user: UserOption) => {
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || '';
    const idNumber = user.idNumber ? `(${user.idNumber})` : '';
    return `${name || user.email} ${idNumber}`;
  };

  const getRoleBadgeColor = (role: string | { _id: string; name: string } | undefined) => {
    // Handle role as object (from populated User model)
    const roleName = typeof role === 'object' && role !== null ? role.name : role;
    
    switch (roleName) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'oas_staff': return 'bg-blue-100 text-blue-800';
      case 'department_head': return 'bg-purple-100 text-purple-800';
      case 'scholar': return 'bg-green-100 text-green-800';
      case 'applicant': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper to get role display name
  const getRoleDisplayName = (role: string | { _id: string; name: string } | undefined): string => {
    if (!role) return 'user';
    if (typeof role === 'object' && role !== null) return role.name || 'user';
    return role;
  };

  // Helper to get role name for comparisons
  const getRoleName = (role: string | { _id: string; name: string } | undefined): string => {
    if (!role) return '';
    if (typeof role === 'object' && role !== null) return role.name || '';
    return role;
  };

  // Get bulk users based on selected role
  const getBulkUsers = useCallback(() => {
    return selectedRole === 'all' ? users : users.filter(u => getRoleName(u.role) === selectedRole);
  }, [selectedRole, users]);

  // Handle scroll for single user list (lazy loading)
  const handleSingleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 50;
    
    if (isNearBottom && !loadingMoreSingle && singleDisplayCount < filteredUsers.length) {
      setLoadingMoreSingle(true);
      // Simulate slight delay for smooth UX
      setTimeout(() => {
        setSingleDisplayCount(prev => Math.min(prev + ITEMS_PER_PAGE, filteredUsers.length));
        setLoadingMoreSingle(false);
      }, 200);
    }
  }, [loadingMoreSingle, singleDisplayCount, filteredUsers.length]);

  // Handle scroll for bulk list (lazy loading)
  const handleBulkScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 50;
    const bulkUsers = getBulkUsers();
    
    if (isNearBottom && !loadingMoreBulk && bulkDisplayCount < bulkUsers.length) {
      setLoadingMoreBulk(true);
      // Simulate slight delay for smooth UX
      setTimeout(() => {
        setBulkDisplayCount(prev => Math.min(prev + ITEMS_PER_PAGE, bulkUsers.length));
        setLoadingMoreBulk(false);
      }, 200);
    }
  }, [loadingMoreBulk, bulkDisplayCount, getBulkUsers]);

  if (!isExpanded) {
    return null;
  }

  return (
    <div className="mt-6 border-0 rounded-xl bg-white shadow-soft">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Send Notifications
            </h3>
            <p className="text-sm text-gray-500">Send notifications to individual users or in bulk.</p>
          </div>
          <div className="flex items-center gap-4">
            {lastSentTime && (
              <div className="text-sm text-gray-500 flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                {sentCount} sent this session
              </div>
            )}
            <Button variant="outline" size="sm" onClick={onToggle}>
              Close
            </Button>
          </div>
        </div>

        <Tabs value={sendMode} onValueChange={(v) => setSendMode(v as 'single' | 'bulk')}>
          <TabsList className="mb-4">
            <TabsTrigger value="single" className="flex items-center gap-2">
              <User className="h-4 w-4" /> Single User
            </TabsTrigger>
            <TabsTrigger value="bulk" className="flex items-center gap-2">
              <Users className="h-4 w-4" /> Bulk Send
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: User Selection */}
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <Label htmlFor="searchUser">Search User</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="searchUser"
                        placeholder="Search by name, email, or ID number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  
                  <div 
                    ref={singleListRef}
                    className="border rounded-md max-h-60 overflow-y-auto"
                    onScroll={handleSingleScroll}
                  >
                    {loadingUsers ? (
                      <div className="p-4 text-center text-gray-500">Loading users...</div>
                    ) : filteredUsers.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">No users found</div>
                    ) : (
                      <div className="divide-y">
                        {filteredUsers.slice(0, singleDisplayCount).map((user) => (
                          <div
                            key={user._id}
                            onClick={() => setSelectedUser(user._id)}
                            className={`p-3 cursor-pointer hover:bg-gray-50 flex items-center justify-between ${
                              selectedUser === user._id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                            }`}
                          >
                            <div>
                              <div className="font-medium text-sm">{getUserDisplayName(user)}</div>
                              <div className="text-xs text-gray-500">{user.email}</div>
                            </div>
                            <Badge className={`text-xs ${getRoleBadgeColor(user.role)}`}>
                              {getRoleDisplayName(user.role)}
                            </Badge>
                          </div>
                        ))}
                        {loadingMoreSingle && (
                          <div className="p-2 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Loading more...
                          </div>
                        )}
                        {!loadingMoreSingle && singleDisplayCount < filteredUsers.length && (
                          <div className="p-2 text-center text-xs text-gray-500">
                            Showing {singleDisplayCount} of {filteredUsers.length} users. Scroll for more.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Right: Notification Form */}
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <Label htmlFor="notificationType">Notification Type</Label>
                    <Select value={notificationType} onValueChange={setNotificationType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {NOTIFICATION_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="Notification title..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      maxLength={100}
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      placeholder="Write your notification message here..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-500 mt-1">{message.length}/500 characters</p>
                  </div>

                  {selectedUser && (
                    <div className="bg-blue-50 p-3 rounded-md">
                      <div className="text-sm text-blue-800">
                        <strong>Sending to:</strong>{' '}
                        {getUserDisplayName(users.find(u => u._id === selectedUser)!)}
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={handleSendSingle} 
                    disabled={loading || !selectedUser || !title.trim() || !message.trim()}
                    className="w-full bg-[#800000] text-white hover:bg-[#600000]"
                  >
                    {loading ? (
                      <>Sending...</>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Notification
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="bulk">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Target Selection */}
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <Label htmlFor="targetRole">Target Audience</Label>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select target role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="applicant">Applicants</SelectItem>
                        <SelectItem value="scholar">Scholars</SelectItem>
                        <SelectItem value="department_head">Department Heads</SelectItem>
                        <SelectItem value="oas_staff">OAS Staff</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-yellow-50 p-3 rounded-md flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <strong>Bulk Notification:</strong> This will send the notification to{' '}
                      <strong>{getBulkUsers().length}</strong>{' '}
                      user(s). Please review before sending.
                    </div>
                  </div>

                  {/* Preview list of recipients */}
                  <div 
                    ref={bulkListRef}
                    className="border rounded-md max-h-60 overflow-y-auto"
                    onScroll={handleBulkScroll}
                  >
                    <div className="p-2 bg-gray-50 text-xs font-medium text-gray-600 sticky top-0">
                      Recipients Preview
                    </div>
                    <div className="divide-y">
                      {getBulkUsers()
                        .slice(0, bulkDisplayCount)
                        .map((user) => (
                          <div key={user._id} className="px-3 py-2 text-sm flex items-center justify-between">
                            <span>{getUserDisplayName(user)}</span>
                            <Badge className={`text-xs ${getRoleBadgeColor(user.role)}`}>
                              {getRoleDisplayName(user.role)}
                            </Badge>
                          </div>
                        ))}
                      {loadingMoreBulk && (
                        <div className="p-2 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Loading more...
                        </div>
                      )}
                      {!loadingMoreBulk && bulkDisplayCount < getBulkUsers().length && (
                        <div className="p-2 text-center text-xs text-gray-500">
                          Showing {bulkDisplayCount} of {getBulkUsers().length} users. Scroll for more.
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Right: Notification Form */}
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <Label htmlFor="bulkNotificationType">Notification Type</Label>
                    <Select value={notificationType} onValueChange={setNotificationType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {NOTIFICATION_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="bulkTitle">Title *</Label>
                    <Input
                      id="bulkTitle"
                      placeholder="Notification title..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      maxLength={100}
                    />
                  </div>

                  <div>
                    <Label htmlFor="bulkMessage">Message *</Label>
                    <Textarea
                      id="bulkMessage"
                      placeholder="Write your notification message here..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-500 mt-1">{message.length}/500 characters</p>
                  </div>

                  <Button 
                    onClick={handleSendBulk} 
                    disabled={loading || !title.trim() || !message.trim()}
                    className="w-full bg-[#800000] text-white hover:bg-[#600000]"
                  >
                    {loading ? (
                      <>Sending to {getBulkUsers().length} users...</>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send to {selectedRole === 'all' ? 'All Users' : selectedRole.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
