import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router";
import { trpc } from "@/providers/trpc";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Star,
  MessageCircle,
  Phone,
  Upload,
  CheckCircle,
  AlertCircle,
  ShoppingCart,
  User,
  Hash,
  CreditCard,
  DollarSign,
  Smartphone,
} from "lucide-react";

export default function Home() {
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get("ref") || "";

  const [username, setUsername] = useState("");
  const [serviceId, setServiceId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("jazzcash");
  const [transactionId, setTransactionId] = useState("");
  const [screenshot, setScreenshot] = useState<string>("");
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [orderResult, setOrderResult] = useState<{ success: boolean; orderId: number } | null>(null);
  const [trackOrderId, setTrackOrderId] = useState("");
  const [showTrackDialog, setShowTrackDialog] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [complaintMessage, setComplaintMessage] = useState("");
  const [complaintWhatsapp, setComplaintWhatsapp] = useState("");
  const [showComplaintDialog, setShowComplaintDialog] = useState(false);

  const { data: services } = trpc.public.getServices.useQuery();
  const { data: adminData } = trpc.public.getAdminByReferral.useQuery(
    { referralCode: refCode },
    { enabled: !!refCode }
  );
  const { data: settings } = trpc.public.getSettings.useQuery();
  const createOrder = trpc.public.createOrder.useMutation();
  const { data: trackedOrder, refetch: refetchOrder } = trpc.public.getOrderStatus.useQuery(
    { orderId: Number(trackOrderId) },
    { enabled: !!trackOrderId && showTrackDialog }
  );
  const submitReview = trpc.public.submitReview.useMutation();
  const submitComplaint = trpc.public.submitComplaint.useMutation();

  const selectedService = useMemo(() => {
    return services?.find((s) => s.id === Number(serviceId));
  }, [services, serviceId]);

  const calculatedPrice = useMemo(() => {
    if (!selectedService || !quantity) return 0;
    const qty = Number(quantity);
    if (isNaN(qty) || qty < 0) return 0;
    return qty * Number(selectedService.pricePerUnit);
  }, [selectedService, quantity]);

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be less than 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshot(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleOrderSubmit = async () => {
    if (!username.trim()) {
      alert("Please enter your TikTok username");
      return;
    }
    if (!serviceId) {
      alert("Please select a service");
      return;
    }
    if (!quantity || Number(quantity) < 1) {
      alert("Please enter a valid quantity");
      return;
    }
    if (!refCode) {
      alert("Invalid referral link. Please use a valid admin link.");
      return;
    }
    if (!transactionId.trim()) {
      alert("Please enter your transaction ID");
      return;
    }

    try {
      const result = await createOrder.mutateAsync({
        tiktokUsername: username.trim(),
        serviceId: Number(serviceId),
        quantity: Number(quantity),
        totalPrice: calculatedPrice.toFixed(2),
        referralCode: refCode,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        paymentMethod,
        transactionId: transactionId || undefined,
        paymentScreenshot: screenshot || undefined,
      });
      setOrderResult(result);
      setShowOrderDialog(true);
    } catch (error: any) {
      alert(error.message || "Failed to place order");
    }
  };

  const handleSubmitReview = async () => {
    if (!trackedOrder) return;
    try {
      await submitReview.mutateAsync({
        orderId: trackedOrder.id,
        rating: reviewRating,
        comment: reviewComment,
        adminId: trackedOrder.adminId,
      });
      alert("Review submitted successfully!");
      setShowReviewDialog(false);
      setReviewComment("");
      setReviewRating(5);
    } catch (error: any) {
      alert(error.message || "Failed to submit review");
    }
  };

  const handleSubmitComplaint = async () => {
    if (!trackedOrder) return;
    try {
      await submitComplaint.mutateAsync({
        orderId: trackedOrder.id,
        message: complaintMessage,
        whatsappNumber: complaintWhatsapp || undefined,
        adminId: trackedOrder.adminId,
      });
      alert("Complaint submitted successfully!");
      setShowComplaintDialog(false);
      setComplaintMessage("");
      setComplaintWhatsapp("");
    } catch (error: any) {
      alert(error.message || "Failed to submit complaint");
    }
  };

  const whatsappLink = settings?.whatsapp_number
    ? `https://wa.me/${settings.whatsapp_number.replace(/\+/g, "")}`
    : "#";

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-pink-600" />
            </div>
            <div>
              <h1 className="text-white font-bold text-xl">{settings?.site_title || "TikTok SMM Panel"}</h1>
              <p className="text-white/70 text-xs">{settings?.site_description || "Best TikTok services"}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-white/30 text-white hover:bg-white/20"
              onClick={() => setShowTrackDialog(true)}
            >
              Track Order
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-white/30 text-white hover:bg-white/20"
              onClick={() => window.location.href = "/admin"}
            >
              Admin
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Referral Info */}
        {adminData ? (
          <Card className="mb-6 bg-white/95 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {adminData.paymentName?.charAt(0).toUpperCase() || "A"}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Admin: {adminData.paymentName || "Admin"}</p>
                  <p className="text-sm text-gray-500">
                    Payment: {adminData.paymentMethod?.toUpperCase()} - {adminData.paymentNumber || "Not set"}
                  </p>
                </div>
                <Badge className="ml-auto bg-green-500">Active</Badge>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6 bg-white/95 backdrop-blur border-red-300">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 text-red-600">
                <AlertCircle className="w-5 h-5" />
                <p className="font-medium">
                  Please use a valid admin referral link to place orders.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Order Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white/95 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-pink-500" />
                  Place Your Order
                </CardTitle>
                <CardDescription>
                  Enter your TikTok username carefully. We need the exact username to deliver your order.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    TikTok Username
                  </Label>
                  <Input
                    placeholder="@username (without @)"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Make sure your username is correct. We are not responsible for wrong usernames.
                  </p>
                </div>

                <div>
                  <Label className="flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    Select Service
                  </Label>
                  <Select value={serviceId} onValueChange={setServiceId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Choose a service" />
                    </SelectTrigger>
                    <SelectContent>
                      {services?.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.name} - Rs. {s.pricePerUnit} per unit (Min: {s.minQuantity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Quantity
                  </Label>
                  <Input
                    type="number"
                    placeholder={`Min: ${selectedService?.minQuantity || 100}`}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="mt-1"
                    min={selectedService?.minQuantity || 100}
                    max={selectedService?.maxQuantity || 100000}
                  />
                </div>

                {/* Price Display */}
                {calculatedPrice > 0 && (
                  <div className="bg-gradient-to-r from-pink-50 to-red-50 border border-pink-200 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Price:</span>
                      <span className="text-2xl font-bold text-pink-600">
                        Rs. {calculatedPrice.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {quantity} x Rs. {selectedService?.pricePerUnit} = Rs. {calculatedPrice.toFixed(2)}
                    </p>
                  </div>
                )}

                {/* Payment Info */}
                {adminData?.paymentMethod && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Payment Details
                    </h4>
                    <div className="mt-2 space-y-1 text-sm">
                      <p className="text-green-700">
                        <span className="font-medium">Method:</span>{" "}
                        {adminData.paymentMethod?.toUpperCase()}
                      </p>
                      <p className="text-green-700">
                        <span className="font-medium">Account #:</span>{" "}
                        {adminData.paymentNumber}
                      </p>
                      <p className="text-green-700">
                        <span className="font-medium">Account Name:</span>{" "}
                        {adminData.paymentName}
                      </p>
                    </div>
                  </div>
                )}

                {/* Payment Method Selection */}
                <div>
                  <Label>Your Payment Method</Label>
                  <div className="flex gap-2 mt-1">
                    <Button
                      type="button"
                      variant={paymentMethod === "jazzcash" ? "default" : "outline"}
                      onClick={() => setPaymentMethod("jazzcash")}
                      className="flex-1"
                    >
                      JazzCash
                    </Button>
                    <Button
                      type="button"
                      variant={paymentMethod === "easypaisa" ? "default" : "outline"}
                      onClick={() => setPaymentMethod("easypaisa")}
                      className="flex-1"
                    >
                      Easypaisa
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    Transaction ID
                  </Label>
                  <Input
                    placeholder="Enter your transaction ID"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Payment Screenshot (Optional)
                  </Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleScreenshotUpload}
                    className="mt-1"
                  />
                  {screenshot && (
                    <img
                      src={screenshot}
                      alt="Payment screenshot"
                      className="mt-2 w-32 h-32 object-cover rounded-lg border"
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Your Name</Label>
                    <Input
                      placeholder="Optional"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Your Phone</Label>
                    <Input
                      placeholder="Optional"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleOrderSubmit}
                  disabled={createOrder.isPending}
                  className="w-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white font-bold py-6"
                >
                  {createOrder.isPending ? "Placing Order..." : "Place Order Now"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <Card className="bg-white/95 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-sm">How It Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    1
                  </div>
                  <p className="text-gray-600">Enter your correct TikTok username</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    2
                  </div>
                  <p className="text-gray-600">Select service and enter quantity</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    3
                  </div>
                  <p className="text-gray-600">Pay via JazzCash or Easypaisa</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    4
                  </div>
                  <p className="text-gray-600">Enter transaction ID and submit</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    5
                  </div>
                  <p className="text-gray-600">Your order will be delivered soon!</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/95 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Need Help?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <Button variant="outline" className="w-full border-green-500 text-green-600 hover:bg-green-50">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Contact on WhatsApp
                  </Button>
                </a>
              </CardContent>
            </Card>

            {/* Services List */}
            <Card className="bg-white/95 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-sm">Our Services</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {services?.map((s) => (
                  <div
                    key={s.id}
                    className="flex justify-between items-center p-2 rounded-lg bg-gray-50"
                  >
                    <span className="text-sm font-medium">{s.name}</span>
                    <span className="text-sm text-pink-600 font-bold">
                      Rs. {s.pricePerUnit}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Order Success Dialog */}
      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-6 h-6" />
              Order Placed Successfully!
            </DialogTitle>
            <DialogDescription>
              Your order has been submitted. Please save your order ID for tracking.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-gray-600 text-sm">Your Order ID</p>
            <p className="text-3xl font-bold text-green-700">#{orderResult?.orderId}</p>
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <strong>TikTok Username:</strong> {username}
            </p>
            <p>
              <strong>Service:</strong> {selectedService?.name}
            </p>
            <p>
              <strong>Quantity:</strong> {quantity}
            </p>
            <p>
              <strong>Total Paid:</strong> Rs. {calculatedPrice.toFixed(2)}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <Badge variant="outline" className="text-yellow-600 border-yellow-400">
                Pending
              </Badge>
            </p>
          </div>
          <Button onClick={() => setShowOrderDialog(false)} className="w-full">
            Close
          </Button>
        </DialogContent>
      </Dialog>

      {/* Track Order Dialog */}
      <Dialog open={showTrackDialog} onOpenChange={setShowTrackDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Track Your Order</DialogTitle>
            <DialogDescription>
              Enter your order ID to check the status.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Input
              placeholder="Enter Order ID"
              value={trackOrderId}
              onChange={(e) => setTrackOrderId(e.target.value)}
            />
            <Button onClick={() => refetchOrder()}>Track</Button>
          </div>

          {trackedOrder && (
            <div className="space-y-3 mt-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Order ID</span>
                  <span className="font-bold">#{trackedOrder.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Username</span>
                  <span className="font-medium">{trackedOrder.tiktokUsername}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Service</span>
                  <span className="font-medium">{trackedOrder.service?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Quantity</span>
                  <span className="font-medium">{trackedOrder.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Total</span>
                  <span className="font-bold">Rs. {trackedOrder.totalPrice}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Status</span>
                  <Badge
                    className={
                      trackedOrder.status === "completed"
                        ? "bg-green-500"
                        : trackedOrder.status === "pending"
                        ? "bg-yellow-500"
                        : trackedOrder.status === "cancelled"
                        ? "bg-red-500"
                        : "bg-blue-500"
                    }
                  >
                    {trackedOrder.status}
                  </Badge>
                </div>
              </div>

              {/* Admin Messages */}
              {trackedOrder.messages && trackedOrder.messages.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Admin Messages</h4>
                  {trackedOrder.messages.map((msg: any) => (
                    <div key={msg.id} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">{msg.message}</p>
                      <p className="text-xs text-blue-500 mt-1">
                        {new Date(msg.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              {trackedOrder.status === "completed" && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-yellow-400 text-yellow-600"
                    onClick={() => setShowReviewDialog(true)}
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Write Review
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-red-400 text-red-600"
                    onClick={() => setShowComplaintDialog(true)}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Complaint
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setReviewRating(star)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= reviewRating
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <Textarea
              placeholder="Write your review..."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
            />
            <Button onClick={handleSubmitReview} className="w-full">
              Submit Review
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Complaint Dialog */}
      <Dialog open={showComplaintDialog} onOpenChange={setShowComplaintDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Complaint</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Describe your issue..."
              value={complaintMessage}
              onChange={(e) => setComplaintMessage(e.target.value)}
            />
            <Input
              placeholder="Your WhatsApp Number (Optional)"
              value={complaintWhatsapp}
              onChange={(e) => setComplaintWhatsapp(e.target.value)}
            />
            <Button onClick={handleSubmitComplaint} className="w-full bg-red-500 hover:bg-red-600">
              Submit Complaint
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
