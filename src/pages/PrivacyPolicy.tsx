import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function PrivacyPolicy() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 py-12">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back
                </button>

                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
                    <div className="text-sm text-gray-600 mb-8">
                        <p>Last Updated On 08-Apr-2025</p>
                        <p>Effective Date 08-Apr-2025</p>
                    </div>

                    <div className="prose prose-gray max-w-none">
                        <p className="mb-6">
                            This Privacy Policy describes the policies of Atrapo, C/pedro i de aragon, 14, Soria 50003, Spain, email: info@atrapo.io, phone: 611962053 on the collection, use and disclosure of your information that we collect when you use our website ( https://atrapo.io ). (the "Service"). By accessing or using the Service, you are consenting to the collection, use and disclosure of your information in accordance with this Privacy Policy. If you do not consent to the same, please do not access or use the Service.
                        </p>

                        <p className="mb-6">
                            We may modify this Privacy Policy at any time without any prior notice to you and will post the revised Privacy Policy on the Service. The revised Policy will be effective 180 days from when the revised Policy is posted in the Service and your continued access or use of the Service after such time will constitute your acceptance of the revised Privacy Policy. We therefore recommend that you periodically review this page.
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Information We Collect:</h2>
                        <p className="mb-4">We will collect and process the following personal information about you:</p>
                        <ul className="list-disc pl-6 mb-6">
                            <li>Name</li>
                            <li>Email</li>
                            <li>Mobile</li>
                            <li>Social Media Profile</li>
                            <li>Date of Birth</li>
                            <li>Address</li>
                            <li>Work Address</li>
                            <li>Payment Info</li>
                        </ul>

                        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">How We Collect Your Information:</h2>
                        <ul className="list-disc pl-6 mb-6">
                            <li>When a user fills up the registration form or otherwise submits personal information</li>
                            <li>Interacts with the website</li>
                            <li>From public sources</li>
                        </ul>

                        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">How We Use Your Information:</h2>
                        <ul className="list-disc pl-6 mb-6">
                            <li>Marketing/ Promotional</li>
                            <li>Creating user account</li>
                            <li>Testimonials</li>
                            <li>Customer feedback collection</li>
                            <li>Enforce T&C</li>
                            <li>Processing payment</li>
                            <li>Support</li>
                            <li>Administration info</li>
                            <li>Targeted advertising</li>
                            <li>Manage customer order</li>
                            <li>Site protection</li>
                            <li>User to user comments</li>
                            <li>Dispute resolution</li>
                            <li>Manage user account</li>
                        </ul>

                        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">WhatsApp Notifications</h2>
                        <p className="mb-6">
                            If you choose to receive notifications via WhatsApp, we collect and use your phone number solely for the purpose of sending transactional alerts related to products you have actively requested through our service. These include matches for second-hand products you are searching for.
                        </p>
                        <p className="mb-6">
                            Messages are sent only with your explicit consent, obtained through a clearly marked checkbox in our registration form.
                        </p>
                        <p className="mb-6">
                            We do not send promotional or advertising messages via WhatsApp.
                        </p>
                        <p className="mb-6">
                            All messages are sent through the official WhatsApp Business API and use only templates approved by WhatsApp.
                        </p>
                        <p className="mb-6">
                            You can unsubscribe at any time by contacting us at info@atrapo.io or by clicking the WhatsApp icon in your account dashboard once registered.
                        </p>
                        <p className="mb-6">
                            We store a record of the consent given, including the user's phone number, date and time of consent, and the context in which it was granted.
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">How We Share Your Information:</h2>
                        <p className="mb-4">
                            We will not transfer your personal information to any third party without seeking your consent, except in limited circumstances as described below:
                        </p>
                        <ul className="list-disc pl-6 mb-6">
                            <li>Ad service</li>
                            <li>Analytics</li>
                            <li>Payment recovery services</li>
                            <li>Data collection & process</li>
                        </ul>

                        <p className="mb-6">
                            We require such third party's to use the personal information we transfer to them only for the purpose for which it was transferred and not to retain it for longer than is required for fulfilling the said purpose.
                        </p>

                        <p className="mb-6">
                            We may also disclose your personal information for the following: (1) to comply with applicable law, regulation, court order or other legal process; (2) to enforce your agreements with us, including this Privacy Policy; or (3) to respond to claims that your use of the Service violates any third-party rights. If the Service or our company is merged or acquired with another company, your information will be one of the assets that is transferred to the new owner.
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Retention Of Your Information:</h2>
                        <p className="mb-6">
                            We will retain your personal information with us for 90 days to 2 years after users terminate their accounts or for as long as we need it to fulfill the purposes for which it was collected as detailed in this Privacy Policy. We may need to retain certain information for longer periods such as record-keeping / reporting in accordance with applicable law or for other legitimate reasons like enforcement of legal rights, fraud prevention, etc. Residual anonymous information and aggregate information, neither of which identifies you (directly or indirectly), may be stored indefinitely.
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Your Rights:</h2>
                        <p className="mb-6">
                            Depending on the law that applies, you may have a right to access and rectify or erase your personal data or receive a copy of your personal data, restrict or object to the active processing of your data, ask us to share (port) your personal information to another entity, withdraw any consent you provided to us to process your data, a right to lodge a complaint with a statutory authority and such other rights as may be relevant under applicable laws. To exercise these rights, you can write to us at info@atrapo.io. We will respond to your request in accordance with applicable law.
                        </p>

                        <p className="mb-6">
                            You may opt-out of direct marketing communications or the profiling we carry out for marketing purposes by writing to us at info@atrapo.io.
                        </p>

                        <p className="mb-6">
                            Do note that if you do not allow us to collect or process the required personal information or withdraw the consent to process the same for the required purposes, you may not be able to access or use the services for which your information was sought.
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Cookies Etc.</h2>
                        <p className="mb-6">
                            To learn more about how we use these and your choices in relation to these tracking technologies, please refer to our Cookie Policy.
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Security:</h2>
                        <p className="mb-6">
                            The security of your information is important to us and we will use reasonable security measures to prevent the loss, misuse or unauthorized alteration of your information under our control. However, given the inherent risks, we cannot guarantee absolute security and consequently, we cannot ensure or warrant the security of any information you transmit to us and you do so at your own risk.
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Third Party Links & Use Of Your Information:</h2>
                        <p className="mb-6">
                            Our Service may contain links to other websites that are not operated by us. This Privacy Policy does not address the privacy policy and other practices of any third parties, including any third party operating any website or service that may be accessible via a link on the Service. We strongly advise you to review the privacy policy of every site you visit. We have no control over and assume no responsibility for the content, privacy policies or practices of any third party sites or services.
                        </p>

                        <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Grievance / Data Protection Officer:</h2>
                        <p className="mb-6">
                            If you have any queries or concerns about the processing of your information that is available with us, you may email our Grievance Officer at atrapo, C/pedro i de aragon, 14, email: info@atrapo.io. We will address your concerns in accordance with applicable law.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}