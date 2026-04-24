import { useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { usePanelAuth } from "@/hooks/usePanelAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  LogOut,
  Home,
  Users,
  Package,
  Star,
  MessageCircle,
  DollarSign,
  BarChart3,
  Trash2,
  Plus,
  Edit,
  CheckCircle,
  XCircle,
  ToggleLeft,
  Lock,
  Crown,
  TrendingUp,
  Clock,
  AlertTriangle,
} from "lucide-react";

export default function OwnerDashboard() {
  usePanelAuth({
    redirectOnUnauthenticated: true,
    redirectPath: "/owner",
    requiredRole: "owner",
  });
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const { data: stats } = trpc.owner.getDashboardStats.useQuery();
  const { data: admins, refetch: refetchAdmins } = trpc.owner.getAllAdmins.useQuery();
  const { data: services, refetch: refetchServices } = trpc.owner.getAllServices.useQuery();
  const { data: orders } = trpc.owner.getAllOrders.useQuery();
  const { data: reviews } = trpc.owner.getAllReviews.useQuery();
  const { data: complaints, refetch: refetchComplaints } = trpc.owner.getAllComplaints.useQuery();
  const { data: settings } = trpc.owner.getSettings.useQuery();

  const createAdmin = trpc.owner.createAdmin.useMutation({
    onSuccess: () => {
      refetchAdmins();
      setNewAdminUsername("");
      setNewAdminPassword("");
    },
  });
  const deleteAdmin = trpc.owner.deleteAdmin.useMutation({
    onSuccess: () => refetchAdmins(),
  });
  const toggleAdmin = trpc.owner.toggleAdminStatus.useMutation({
    onSuccess: () => refetchAdmins(),
  });
  const createService = trpc.owner.createService.useMutation({
    onSuccess: () => refetchServices(),
  });
  const updateService = trpc.owner.updateService.useMutation({
    onSuccess: () => refetchServices(),
  });
  const deleteService = trpc.owner.deleteService.useMutation({
    onSuccess: () => refetchServices(),
  });
  const changePassword = trpc.owner.changeOwnerPassword.useMutation();
  const resolveComplaint = trpc.owner.resolveComplaint.useMutation({
    onSuccess: () => refetchComplaints(),
  });
  const logout = trpc.panelAuth.logout.useMutation({
    onSuccess: () => {
      utils.invalidate();
      navigate("/owner");
    },
  });

  const [newAdminUsername, setNewAdminUsername] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceType, setNewServiceType] = useState("followers");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [newServiceMin, setNewServiceMin] = useState("100");
  const [newServiceMax, setNewServiceMax] = useState("100000");
  const [showEditService, setShowEditService] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");

  const handleCreateAdmin = async () => {
    if (!newAdminUsername.trim() || !newAdminPassword.trim()) {
      alert("Please fill all fields");
      return;
    }
    try {
      await createAdmin.mutateAsync({
        username: newAdminUsername,
        password: newAdminPassword,
        role: "admin",
      });
      alert("Admin created successfully!");
    } catch (error: any) {
      alert(error.message || "Failed to create admin");
    }
  };

  const handleCreateService = async () => {
    if (!newServiceName.trim() || !newServicePrice) {
      alert("Please fill all fields");
      return;
    }
    try {
      await createService.mutateAsync({
        name: newServiceName,
        type: newServiceType as any,
        pricePerUnit: newServicePrice,
        minQuantity: Number(newServiceMin),
        maxQuantity: Number(newServiceMax),
      });
      alert("Service created!");
      setNewServiceName("");
      setNewServicePrice("");
    } catch (error: any) {
      alert(error.message || "Failed to create service");
    }
  };

  const handleUpdateService = async () => {
    if (!editingService) return;
    try {
      await updateService.mutateAsync({
        id: editingService.id,
        name: editingService.name,
        type: editingService.type,
        pricePerUnit: editingService.pricePerUnit,
        minQuantity: Number(editingService.minQuantity),
        maxQuantity: Number(editingService.maxQuantity),
        isActive: editingService.isActive,
      });
      setShowEditService(false);
      setEditingService(null);
    } catch (error: any) {
      alert(error.message || "Failed to update service");
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword.trim()) {
      alert("Please enter new password");
      return;
    }
    try {
      await changePassword.mutateAsync({ newPassword });
      alert("Password changed successfully!");
      setNewPassword("");
    } catch (error: any) {
      alert(error.message || "Failed to change password");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge className="bg-yellow-500">Pending</Badge>;
      case "confirmed": return <Badge className="bg-blue-500">Confirmed</Badge>;
      case "processing": return <Badge className="bg-purple-500">Processing</Badge>;
      case "completed": return <Badge className="bg-green-500">Completed</Badge>;
      case "cancelled": return <Badge className="bg-red-500">Cancelled</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Owner Dashboard</h1>
              <p className="text-sm text-white/70">Full Control Panel</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="border-white/30 text-white hover:bg-white/20" onClick={() => navigate("/")}>
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-white/30 text-white hover:bg-white/20"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Orders</p>
                  <p className="text-xl font-bold">{stats?.totalOrders ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pending</p>
                  <p className="text-xl font-bold">{stats?.pending ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Completed</p>
                  <p className="text-xl font-bold">{stats?.completed ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Revenue</p>
                  <p className="text-xl font-bold">Rs. {stats?.totalRevenue ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="admins" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 lg:w-auto">
            <TabsTrigger value="admins"><Users className="w-4 h-4 mr-1" />Admins</TabsTrigger>
            <TabsTrigger value="services"><DollarSign className="w-4 h-4 mr-1" />Services</TabsTrigger>
            <TabsTrigger value="orders"><Package className="w-4 h-4 mr-1" />Orders</TabsTrigger>
            <TabsTrigger value="reviews"><Star className="w-4 h-4 mr-1" />Reviews</TabsTrigger>
            <TabsTrigger value="complaints"><MessageCircle className="w-4 h-4 mr-1" />Complaints</TabsTrigger>
            <TabsTrigger value="settings"><Lock className="w-4 h-4 mr-1" />Settings</TabsTrigger>
          </TabsList>

          {/* Admins Tab */}
          <TabsContent value="admins">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Manage Admins
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    placeholder="Username"
                    value={newAdminUsername}
                    onChange={(e) => setNewAdminUsername(e.target.value)}
                  />
                  <Input
                    placeholder="Password"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                  />
                  <Button
                    onClick={handleCreateAdmin}
                    disabled={createAdmin.isPending}
                    className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Admin
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Referral</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {admins?.map((admin) => {
                      const adminStat = stats?.adminStats?.find((s: any) => s.admin.id === admin.id);
                      return (
                        <TableRow key={admin.id}>
                          <TableCell>{admin.id}</TableCell>
                          <TableCell className="font-medium">{admin.username}</TableCell>
                          <TableCell>
                            <Badge className={admin.role === "owner" ? "bg-purple-500" : "bg-blue-500"}>
                              {admin.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {admin.paymentMethod ? `${admin.paymentMethod} - ${admin.paymentNumber}` : "Not set"}
                          </TableCell>
                          <TableCell>
                            <Badge className={admin.isActive === "true" ? "bg-green-500" : "bg-red-500"}>
                              {admin.isActive === "true" ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate">
                            {admin.referralCode || "-"}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              T:{adminStat?.total || 0} | C:{adminStat?.completed || 0} | P:{adminStat?.pending || 0}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {admin.role !== "owner" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => toggleAdmin.mutate({ id: admin.id })}
                                  >
                                    <ToggleLeft className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-500 border-red-300"
                                    onClick={() => {
                                      if (confirm("Delete this admin?")) {
                                        deleteAdmin.mutate({ id: admin.id });
                                      }
                                    }}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Manage Services & Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                  <Input
                    placeholder="Service Name"
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                  />
                  <select
                    className="border rounded-md px-3 py-2"
                    value={newServiceType}
                    onChange={(e) => setNewServiceType(e.target.value)}
                  >
                    <option value="followers">Followers</option>
                    <option value="likes">Likes</option>
                    <option value="comments">Comments</option>
                    <option value="shares">Shares</option>
                    <option value="views">Views</option>
                  </select>
                  <Input
                    placeholder="Price per unit (Rs.)"
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(e.target.value)}
                  />
                  <Input
                    placeholder="Min Qty"
                    value={newServiceMin}
                    onChange={(e) => setNewServiceMin(e.target.value)}
                  />
                  <Input
                    placeholder="Max Qty"
                    value={newServiceMax}
                    onChange={(e) => setNewServiceMax(e.target.value)}
                  />
                  <Button
                    onClick={handleCreateService}
                    disabled={createService.isPending}
                    className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Service
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Price/Unit</TableHead>
                      <TableHead>Min-Max</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services?.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell>{service.id}</TableCell>
                        <TableCell className="font-medium">{service.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{service.type}</Badge>
                        </TableCell>
                        <TableCell>Rs. {service.pricePerUnit}</TableCell>
                        <TableCell>{service.minQuantity} - {service.maxQuantity}</TableCell>
                        <TableCell>
                          <Badge className={service.isActive === "true" ? "bg-green-500" : "bg-red-500"}>
                            {service.isActive === "true" ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingService(service);
                                setShowEditService(true);
                              }}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-500 border-red-300"
                              onClick={() => {
                                if (confirm("Delete this service?")) {
                                  deleteService.mutate({ id: service.id });
                                }
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  All Orders (Live Monitoring)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Admin</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders?.map((order: any) => (
                        <TableRow key={order.id}>
                          <TableCell>#{order.id}</TableCell>
                          <TableCell>@{order.tiktokUsername}</TableCell>
                          <TableCell>{order.service?.name}</TableCell>
                          <TableCell>{order.quantity}</TableCell>
                          <TableCell>Rs. {order.totalPrice}</TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{order.admin?.username}</Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Customer Reviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reviews?.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No reviews yet</p>
                  )}
                  {reviews?.map((review: any) => (
                    <div key={review.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">Order #{review.orderId}</p>
                          <p className="text-sm text-gray-500">
                            Admin: {review.admin?.username} | via {review.admin?.referralCode}
                          </p>
                        </div>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-5 h-5 ${
                                star <= review.rating
                                  ? "text-yellow-400 fill-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="mt-2 text-gray-700">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Complaints Tab */}
          <TabsContent value="complaints">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Customer Complaints
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {complaints?.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No complaints yet</p>
                  )}
                  {complaints?.map((complaint: any) => (
                    <div key={complaint.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">Order #{complaint.orderId}</p>
                          <p className="text-sm text-gray-500">
                            Admin: {complaint.admin?.username} | via {complaint.admin?.referralCode}
                          </p>
                        </div>
                        <Badge className={complaint.status === "resolved" ? "bg-green-500" : "bg-red-500"}>
                          {complaint.status}
                        </Badge>
                      </div>
                      <p className="mt-2 text-gray-700">{complaint.message}</p>
                      {complaint.whatsappNumber && (
                        <p className="mt-1 text-sm text-green-600">
                          WhatsApp: {complaint.whatsappNumber}
                        </p>
                      )}
                      {complaint.status === "open" && (
                        <Button
                          size="sm"
                          className="mt-2"
                          onClick={() => resolveComplaint.mutate({ id: complaint.id })}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Mark Resolved
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Owner Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Change Owner Password
                  </h4>
                  <div className="mt-3 flex gap-2">
                    <Input
                      type="password"
                      placeholder="New password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <Button
                      onClick={handleChangePassword}
                      disabled={changePassword.isPending}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      Change
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-500">Total Admins</p>
                      <p className="text-2xl font-bold">{stats?.totalAdmins ?? 0}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-500">Total Reviews</p>
                      <p className="text-2xl font-bold">{stats?.totalReviews ?? 0}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-500">Total Complaints</p>
                      <p className="text-2xl font-bold">{stats?.totalComplaints ?? 0}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-500">Site Title</p>
                      <p className="text-lg font-bold">{settings?.site_title || "TikTok SMM Panel"}</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit Service Dialog */}
      <Dialog open={showEditService} onOpenChange={setShowEditService}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
          </DialogHeader>
          {editingService && (
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={editingService.name}
                  onChange={(e) =>
                    setEditingService({ ...editingService, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Type</Label>
                <select
                  className="w-full border rounded-md px-3 py-2"
                  value={editingService.type}
                  onChange={(e) =>
                    setEditingService({ ...editingService, type: e.target.value })
                  }
                >
                  <option value="followers">Followers</option>
                  <option value="likes">Likes</option>
                  <option value="comments">Comments</option>
                  <option value="shares">Shares</option>
                  <option value="views">Views</option>
                </select>
              </div>
              <div>
                <Label>Price per Unit</Label>
                <Input
                  value={editingService.pricePerUnit}
                  onChange={(e) =>
                    setEditingService({ ...editingService, pricePerUnit: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Min Quantity</Label>
                  <Input
                    value={editingService.minQuantity}
                    onChange={(e) =>
                      setEditingService({ ...editingService, minQuantity: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Max Quantity</Label>
                  <Input
                    value={editingService.maxQuantity}
                    onChange={(e) =>
                      setEditingService({ ...editingService, maxQuantity: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <Label>Status</Label>
                <div className="flex gap-2 mt-1">
                  <Button
                    variant={editingService.isActive === "true" ? "default" : "outline"}
                    onClick={() => setEditingService({ ...editingService, isActive: "true" })}
                  >
                    Active
                  </Button>
                  <Button
                    variant={editingService.isActive === "false" ? "default" : "outline"}
                    onClick={() => setEditingService({ ...editingService, isActive: "false" })}
                  >
                    Inactive
                  </Button>
                </div>
              </div>
              <Button onClick={handleUpdateService} className="w-full">
                Save Changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
