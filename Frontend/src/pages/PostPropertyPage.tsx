
import React, { useState, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, UserIcon, MailIcon, PhoneIcon, MapPinIcon, HomeIcon, DollarSignIcon, CalendarIcon, ImageIcon, VideoIcon, ShieldCheckIcon, CrownIcon, UploadIcon } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { toast } from 'sonner';
const TOTAL_STEPS = 5;
export function PostPropertyPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  // Form data
  const [ownerDetails, setOwnerDetails] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    profilePhoto: null as File | null
  });
  const [propertyDetails, setPropertyDetails] = useState({
    type: '',
    location: '',
    price: '',
    availableFrom: '',
    availableTo: '',
    rooms: '',
    status: 'available',
    description: '',
    amenities: [] as string[]
  });
  const [images, setImages] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [legalDocument, setLegalDocument] = useState<File | null>(null);
  const amenitiesList = ['WiFi', 'Parking', 'Elevator', 'Security', 'Water Supply', 'Backup Power', 'Garden', 'Gym'];
  const handleNext = () => {
    if (currentStep === 1) {
      // Validate phone: must be exactly 10 digits (excluding +977 prefix)
      const digits = ownerDetails.phone.replace(/\D/g, '');
      if (ownerDetails.phone && digits.length !== 10 && digits.length !== 13) {
        toast.error('Phone number should be 10 digits');
        return;
      }
      // If 13 digits, check if it starts with 977
      if (digits.length === 13 && !digits.startsWith('977')) {
        toast.error('Phone number should be 10 digits');
        return;
      }
      // If 13 digits starting with 977, extract last 10 digits
      if (digits.length === 13) {
        const last10 = digits.slice(3);
        if (last10.length !== 10) {
          toast.error('Phone number should be 10 digits');
          return;
        }
      }
    }
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Convert first image to base64 if available
      let imageUrl = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop';
      if (images.length > 0) {
        const reader = new FileReader();
        imageUrl = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(images[0]);
        });
      }

      const user = JSON.parse(localStorage.getItem('flatmate_user') || '{}');
      const ownerName = user.name || ownerDetails.name || 'Owner';

      const propertyData = {
        id: `p${Date.now()}`,
        title: propertyDetails.type + ' in ' + propertyDetails.location,
        location: propertyDetails.location,
        rent: parseInt(propertyDetails.price),
        beds: parseInt(propertyDetails.rooms),
        baths: 1,
        type: propertyDetails.type,
        area: '850 sqft',
        status: 'pending',
        furnishing: 'Unfurnished',
        parking: 'Available',
        wifi: propertyDetails.amenities.includes('WiFi'),
        description: propertyDetails.description,
        amenities: propertyDetails.amenities,
        image: imageUrl,
        ownerName: ownerName,
        postedAt: new Date().toISOString().split('T')[0],
        views: 0,
        saves: 0,
        inquiries: 0
      };

      // Save to localStorage
      const allProperties = JSON.parse(localStorage.getItem('fm_all_properties') || '[]');
      allProperties.unshift(propertyData);
      localStorage.setItem('fm_all_properties', JSON.stringify(allProperties));

      // Notify admin
      const adminNotifs = JSON.parse(localStorage.getItem('fm_admin_notifs') || '[]');
      adminNotifs.unshift({
        id: Date.now().toString(),
        type: 'new_property',
        title: 'New Property Submitted',
        msg: `${ownerName} submitted: "${propertyData.title}"`,
        time: 'Just now',
        read: false,
        propId: propertyData.id
      });
      localStorage.setItem('fm_admin_notifs', JSON.stringify(adminNotifs));

      toast.success('Property submitted for admin review!', {
        style: {
          background: '#2F7D5F',
          color: 'white',
        },
      });
      navigate('/dashboard/owner');
    } catch (error: any) {
      console.error('Error submitting property:', error);
      toast.error(error.message || 'Failed to submit property');
    } finally {
      setIsLoading(false);
    }
  };
  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otpCode];
      newOtp[index] = value;
      setOtpCode(newOtp);
      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        nextInput?.focus();
      }
    }
  };
  const toggleAmenity = (amenity: string) => {
    setPropertyDetails(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity) ? prev.amenities.filter(a => a !== amenity) : [...prev.amenities, amenity]
    }));
  };
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <motion.div initial={{
          opacity: 0,
          x: 20
        }} animate={{
          opacity: 1,
          x: 0
        }} exit={{
          opacity: 0,
          x: -20
        }} className="space-y-6">
            <h2 className="text-2xl font-bold text-primary mb-6">
              Owner Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Full Name" type="text" placeholder="Enter your full name" value={ownerDetails.name} onChange={e => setOwnerDetails({
              ...ownerDetails,
              name: e.target.value
            })} icon={<UserIcon className="w-5 h-5" />} />
              <Input label="Email Address" type="email" placeholder="you@example.com" value={ownerDetails.email} onChange={e => setOwnerDetails({
              ...ownerDetails,
              email: e.target.value
            })} icon={<MailIcon className="w-5 h-5" />} />
              <Input label="Phone Number" type="tel" placeholder="+977 98XXXXXXXX" value={ownerDetails.phone}
              onChange={e => {
                // Allow only digits and leading +
                const val = e.target.value.replace(/[^\d+]/g, '')
                setOwnerDetails({ ...ownerDetails, phone: val })
              }}
              maxLength={14}
              icon={<PhoneIcon className="w-5 h-5" />} />
              <Input label="Address" type="text" placeholder="Your address" value={ownerDetails.address} onChange={e => setOwnerDetails({
              ...ownerDetails,
              address: e.target.value
            })} icon={<MapPinIcon className="w-5 h-5" />} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Photo
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-button-primary transition-colors cursor-pointer">
                <input type="file" accept="image/*" onChange={e => setOwnerDetails({
                ...ownerDetails,
                profilePhoto: e.target.files?.[0] || null
              })} className="hidden" id="profile-photo" />
                <label htmlFor="profile-photo" className="cursor-pointer">
                  <UploadIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    Click to upload profile photo
                  </p>
                </label>
              </div>
            </div>
          </motion.div>;
      case 2:
        return <motion.div initial={{
          opacity: 0,
          x: 20
        }} animate={{
          opacity: 1,
          x: 0
        }} exit={{
          opacity: 0,
          x: -20
        }} className="space-y-6">
            <h2 className="text-2xl font-bold text-primary mb-6">
              Property Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select label="Property Type" placeholder="Select type" value={propertyDetails.type} onChange={e => setPropertyDetails({
              ...propertyDetails,
              type: e.target.value
            })} options={[{
              value: 'room',
              label: 'Room'
            }, {
              value: '1bhk',
              label: '1BHK'
            }, {
              value: '2bhk',
              label: '2BHK'
            }, {
              value: '3bhk',
              label: '3BHK+'
            }, {
              value: 'studio',
              label: 'Studio'
            }, {
              value: 'shared',
              label: 'Shared'
            }]} />
              <Input label="Location" type="text" placeholder="e.g., Thamel, Kathmandu" value={propertyDetails.location} onChange={e => setPropertyDetails({
              ...propertyDetails,
              location: e.target.value
            })} icon={<MapPinIcon className="w-5 h-5" />} />
              <Input label="Monthly Rent (NPR)" type="number" placeholder="25000" value={propertyDetails.price} onChange={e => setPropertyDetails({
              ...propertyDetails,
              price: e.target.value
            })} icon={<DollarSignIcon className="w-5 h-5" />} />
              <Input label="Number of Rooms" type="number" placeholder="2" value={propertyDetails.rooms} onChange={e => setPropertyDetails({
              ...propertyDetails,
              rooms: e.target.value
            })} icon={<HomeIcon className="w-5 h-5" />} />
              <Input label="Available From" type="date" value={propertyDetails.availableFrom} onChange={e => setPropertyDetails({
              ...propertyDetails,
              availableFrom: e.target.value
            })} icon={<CalendarIcon className="w-5 h-5" />} />
              <Input label="Available To" type="date" value={propertyDetails.availableTo} onChange={e => setPropertyDetails({
              ...propertyDetails,
              availableTo: e.target.value
            })} icon={<CalendarIcon className="w-5 h-5" />} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea rows={4} placeholder="Describe your property..." value={propertyDetails.description} onChange={e => setPropertyDetails({
              ...propertyDetails,
              description: e.target.value
            })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-button-primary focus:border-transparent" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Amenities
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {amenitiesList.map(amenity => <button key={amenity} type="button" onClick={() => toggleAmenity(amenity)} className={`p-3 rounded-lg border-2 transition-all ${propertyDetails.amenities.includes(amenity) ? 'border-button-primary bg-background-accent text-button-primary' : 'border-gray-200 hover:border-gray-300'}`}>
                    {amenity}
                  </button>)}
              </div>
            </div>
          </motion.div>;
      case 3:
        return <motion.div initial={{
          opacity: 0,
          x: 20
        }} animate={{
          opacity: 1,
          x: 0
        }} exit={{
          opacity: 0,
          x: -20
        }} className="space-y-6">
            <h2 className="text-2xl font-bold text-primary mb-6">
              Upload Images
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Images (Multiple)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-button-primary transition-colors cursor-pointer">
                <input type="file" accept="image/*" multiple onChange={e => setImages(Array.from(e.target.files || []))} className="hidden" id="property-images" />
                <label htmlFor="property-images" className="cursor-pointer">
                  <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600 mb-1">
                    Click to upload property images
                  </p>
                  <p className="text-sm text-gray-400">
                    Upload multiple images (JPG, PNG)
                  </p>
                </label>
              </div>
              {images.length > 0 && <p className="text-sm text-green-600 mt-2">
                  {images.length} image(s) selected
                </p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Video
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-button-primary transition-colors cursor-pointer">
                <input type="file" accept="video/*" onChange={e => setVideo(e.target.files?.[0] || null)} className="hidden" id="property-video" />
                <label htmlFor="property-video" className="cursor-pointer">
                  <VideoIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600 mb-1">
                    Click to upload property video
                  </p>
                  <p className="text-sm text-gray-400">MP4, MOV, AVI</p>
                </label>
              </div>
              {video && <p className="text-sm text-green-600 mt-2">
                  Video selected: {video.name}
                </p>}
            </div>

            {/* Subscription CTA */}
            <Card className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                  <CrownIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-primary mb-2">
                    Upgrade to Premium
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    To upload videos and get more visibility, upgrade to our
                    premium plan.
                  </p>
                  <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600">
                    View Subscription Plans
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>;
      case 4:
        return <motion.div initial={{
          opacity: 0,
          x: 20
        }} animate={{
          opacity: 1,
          x: 0
        }} exit={{
          opacity: 0,
          x: -20
        }} className="space-y-6">
            <h2 className="text-2xl font-bold text-primary mb-6">
              Verification
            </h2>

            <Card className="p-6 bg-blue-50 border-2 border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheckIcon className="w-6 h-6 text-blue-600" />
                <h3 className="font-bold text-primary">Phone Verification</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Enter the 6-digit OTP sent to{' '}
                {ownerDetails.phone || 'your phone'}
              </p>
              <div className="flex gap-2 justify-center mb-4">
                {otpCode.map((digit, index) => <input key={index} id={`otp-${index}`} type="text" maxLength={1} value={digit} onChange={e => handleOtpChange(index, e.target.value)} className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-button-primary focus:ring-2 focus:ring-button-primary" />)}
              </div>
              <button className="text-sm text-button-primary hover:underline">
                Resend OTP
              </button>
            </Card>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Legal Document (Citizenship/Passport/Ownership Proof)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-button-primary transition-colors cursor-pointer">
                <input type="file" accept="image/*,application/pdf" onChange={e => setLegalDocument(e.target.files?.[0] || null)} className="hidden" id="legal-document" />
                <label htmlFor="legal-document" className="cursor-pointer">
                  <ShieldCheckIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600 mb-1">Upload legal document</p>
                  <p className="text-sm text-gray-400">JPG, PNG, or PDF</p>
                </label>
              </div>
              {legalDocument && <p className="text-sm text-green-600 mt-2">
                  Document uploaded: {legalDocument.name}
                </p>}
            </div>
          </motion.div>;
      case 5:
        return <motion.div initial={{
          opacity: 0,
          x: 20
        }} animate={{
          opacity: 1,
          x: 0
        }} exit={{
          opacity: 0,
          x: -20
        }} className="space-y-6">
            <h2 className="text-2xl font-bold text-primary mb-6">
              Review & Submit
            </h2>

            <Card className="p-6">
              <h3 className="font-bold text-primary mb-4">Property Preview</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Property Type</p>
                  <p className="font-semibold">
                    {propertyDetails.type || 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Location</p>
                  <p className="font-semibold">
                    {propertyDetails.location || 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Monthly Rent</p>
                  <p className="font-semibold">
                    NPR {propertyDetails.price || '0'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Rooms</p>
                  <p className="font-semibold">
                    {propertyDetails.rooms || '0'}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500">Amenities</p>
                  <p className="font-semibold">
                    {propertyDetails.amenities.join(', ') || 'None'}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500">Images</p>
                  <p className="font-semibold">
                    {images.length} image(s) uploaded
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-green-50 border-2 border-green-200">
              <div className="flex items-center gap-3">
                <CheckIcon className="w-6 h-6 text-green-600" />
                <div>
                  <h3 className="font-bold text-primary">Ready to Submit</h3>
                  <p className="text-sm text-gray-600">
                    Your property will be reviewed and published within 24
                    hours.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>;
      default:
        return null;
    }
  };
  return <main className="min-h-screen bg-background-light py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-primary mb-4 transition-colors">
            <ArrowLeftIcon className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-primary mb-2">
            Post a Property
          </h1>
          <p className="text-gray-600">
            List your property and find the perfect tenant
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {Array.from({
            length: TOTAL_STEPS
          }).map((_, index) => <Fragment key={index}>
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${index + 1 < currentStep ? 'bg-button-primary text-white' : index + 1 === currentStep ? 'bg-button-primary text-white ring-4 ring-button-primary/30' : 'bg-gray-200 text-gray-400'}`}>
                    {index + 1 < currentStep ? <CheckIcon className="w-5 h-5" /> : index + 1}
                  </div>
                  <p className="text-xs mt-2 text-gray-600">
                    {['Owner', 'Property', 'Images', 'Verify', 'Review'][index]}
                  </p>
                </div>
                {index < TOTAL_STEPS - 1 && <div className={`flex-1 h-1 mx-2 rounded transition-all ${index + 1 < currentStep ? 'bg-button-primary' : 'bg-gray-200'}`} />}
              </Fragment>)}
          </div>
        </div>

        {/* Form Content */}
        <Card className="p-8 mb-6">
          <AnimatePresence mode="wait">{renderStepContent()}</AnimatePresence>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button variant="secondary" onClick={handleBack} disabled={currentStep === 1} className="gap-2">
            <ArrowLeftIcon className="w-4 h-4" />
            Back
          </Button>

          {currentStep < TOTAL_STEPS ? <Button onClick={handleNext} className="gap-2">
              Next
              <ArrowRightIcon className="w-4 h-4" />
            </Button> : <Button onClick={handleSubmit} isLoading={isLoading} className="gap-2">
              <CheckIcon className="w-4 h-4" />
              Submit Property
            </Button>}
        </div>
      </div>
    </main>;
}