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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  LogOut,
  Home,
  Package,
  MessageSquare,
  CreditCard,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  Copy,
  Link,
  DollarSign,
  BarChart3,
  AlertCircle,
  Smartphone,
} from "lucide-react";

export default function AdminDashboard() {
  usePanelAuth({ redirectOnUnauthenticated: true, redirectPath: "/admin" });
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const { data: profile } = trpc.admin.getMyProfile.useQuery();
  const { data: orders, refetch: refetchOrders } = trpc.admin.getMyOrders.useQuery();
  const { data: stats } = trpc.admin.getStats.useQuery();
  const { data: messages } = trpc.admin.getMyMessages.useQuery();
  const updateOrderStatus = trpc.admin.updateOrderStatus.useMutation({
    onSuccess: () => {
      refetchOrders();
      utils.admin.getStats.invalidate();
    },
  });
  const updatePaymentInfo = trpc.admin.updatePaymentInfo.useMutation({
    onSuccess: () => {
      utils.admin.getMyProfile.invalidate();
    },
  });
  const sendMessage = trpc.admin.sendMessage.useMutation({
    onSuccess: () => {
      utils.admin.getMyMessages.invalidate();
    },
  });
  const logout = trpc.panelAuth.logout.useMutation({
    onSuccess: () => {
      utils.invalidate();
      navigate("/admin");
    },
  });

  const [paymentMethod, setPaymentMethod] = useState(profile?.paymentMethod || "jazzcash");
  const [paymentNumber, setPaymentNumber] = useState(profile?.paymentNumber || "");
  const [paymentName, setPaymentName] = useState(profile?.paymentName || "");
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");

  const handleCopyLink = () => {
    if (profile?.referralCode) {
      const link = `${window.location.origin}/?ref=${profile.referralCode}`;
      navigator.clipboard.writeText(link);
      alert("Link copied to clipboard!");
    }
  };

  const handleUpdatePayment = async () => {
    try {
      const result = await updatePaymentInfo.mutateAsync({
        paymentMethod,
        paymentNumber,
        paymentName,
      });
      if (result.referralLink) {
        alert(`Payment info updated!\nYour referral link: ${result.referralLink}`);
      }
    } catch (error: any) {
      alert(error.message || "Failed to update payment info");
    }
  };

  const handleSendMessage = async () => {
    if (!selectedOrderId || !messageText.trim()) return;
    try {
      await sendMessage.mutateAsync({
        orderId: selectedOrderId,
        message: messageText,
      });
      setMessageText("");
      setShowMessageDialog(false);
      alert("Message sent!");
    } catch (error: any) {
      alert(error.message || "Failed to send message");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case "confirmed":
        return <Badge className="bg-blue-500">Confirmed</Badge>;
      case "processing":
        return <Badge className="bg-purple-500">Processing</Badge>;
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold">
              A
            </div>
            <div>
              <h1 className="font-bold text-lg">Admin Dashboard</h1>
              <p className="text-sm text-gray-500">Welcome, {profile?.username || "Admin"}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/")}>
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
            <Button
              variant="outline"
              size="sm"
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
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Cancelled</p>
                  <p className="text-xl font-bold">{stats?.cancelled ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Revenue</p>
                  <p className="text-xl font-bold">Rs. {stats?.revenue ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="orders" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="orders">
              <Package className="w-4 h-4 mr-2" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="payment">
              <CreditCard className="w-4 h-4 mr-2" />
              Payment Info
            </TabsTrigger>
            <TabsTrigger value="link">
              <Link className="w-4 h-4 mr-2" />
              My Link
            </TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  My Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders?.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No orders yet</p>
                    </div>
                  )}
                  {orders?.map((order: any) => (
                    <div
                      key={order.id}
                      className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">
                            Order #{order.id} - {order.service?.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            @{order.tiktokUsername} | Qty: {order.quantity} | Rs.{" "}
                            {order.totalPrice}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(order.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {order.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateOrderStatus.mutate({
                                  orderId: order.id,
                                  status: "confirmed",
                                })
                              }
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-500 border-red-300"
                              onClick={() =>
                                updateOrderStatus.mutate({
                                  orderId: order.id,
                                  status: "cancelled",
                                })
                              }
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Cancel
                            </Button>
                          </>
                        )}
                        {order.status === "confirmed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateOrderStatus.mutate({
                                orderId: order.id,
                                status: "processing",
                              })
                            }
                          >
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Start Processing
                          </Button>
                        )}
                        {order.status === "processing" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-300"
                            onClick={() =>
                              updateOrderStatus.mutate({
                                orderId: order.id,
                                status: "completed",
                              })
                            }
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Complete
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedOrderId(order.id);
                            setShowMessageDialog(true);
                          }}
                        >
                          <MessageSquare className="w-3 h-3 mr-1" />
                          Message
                        </Button>
                      </div>

                      {order.transactionId && (
                        <div className="bg-gray-50 rounded p-2 text-sm">
                          <p>
                            <strong>Transaction ID:</strong> {order.transactionId}
                          </p>
                          <p>
                            <strong>Payment Method:</strong>{" "}
                            {order.paymentMethod?.toUpperCase()}
                          </p>
                        </div>
                      )}
                      {order.paymentScreenshot && (
                        <img
                          src={order.paymentScreenshot}
                          alt="Payment"
                          className="w-24 h-24 object-cover rounded border"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Info Tab */}
          <TabsContent value="payment">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Payment Method</Label>
                  <div className="flex gap-2 mt-1">
                    <Button
                      type="button"
                      variant={paymentMethod === "jazzcash" ? "default" : "outline"}
                      onClick={() => setPaymentMethod("jazzcash")}
                      className="flex-1"
                    >
                      <Smartphone className="w-4 h-4 mr-2" />
                      JazzCash
                    </Button>
                    <Button
                      type="button"
                      variant={paymentMethod === "easypaisa" ? "default" : "outline"}
                      onClick={() => setPaymentMethod("easypaisa")}
                      className="flex-1"
                    >
                      <Smartphone className="w-4 h-4 mr-2" />
                      Easypaisa
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Account Number</Label>
                  <Input
                    placeholder="03XXXXXXXXX"
                    value={paymentNumber}
                    onChange={(e) => setPaymentNumber(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Account Name</Label>
                  <Input
                    placeholder="Your name on account"
                    value={paymentName}
                    onChange={(e) => setPaymentName(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleUpdatePayment}
                  disabled={updatePaymentInfo.isPending}
                  className="w-full bg-gradient-to-r from-pink-500 to-red-500 text-white"
                >
                  {updatePaymentInfo.isPending ? "Saving..." : "Save Payment Info"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Link Tab */}
          <TabsContent value="link">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link className="w-5 h-5" />
                  Your Referral Link
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile?.referralCode ? (
                  <>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-green-800 font-medium">Your Unique Link</p>
                      <p className="text-sm text-green-700 mt-1 break-all">
                        {window.location.origin}/?ref={profile.referralCode}
                      </p>
                    </div>
                    <Button onClick={handleCopyLink} className="w-full">
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Link
                    </Button>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-800 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Share this link with customers. All orders from this link will come to
                        you.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-500">
                      Please set your payment information first to generate your referral link.
                    </p>
                    <Button
                      className="mt-4"
                      onClick={() => {
                        const tabs = document.querySelectorAll('[role="tab"]');
                        tabs[1]?.click();
                      }}
                    >
                      Go to Payment Info
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Message Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Message to Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Type your message... (e.g. Please wait, server issue)"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
            />
            <Button onClick={handleSendMessage} disabled={sendMessage.isPending} className="w-full">
              <Send className="w-4 h-4 mr-2" />
              {sendMessage.isPending ? "Sending..." : "Send Message"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
