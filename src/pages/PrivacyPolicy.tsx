import React from 'react';
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
                    <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>

                    <div className="space-y-6 text-gray-600">
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>
                            <p className="mb-4">
                                We collect information that you provide directly to us, including:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Name and email address when you create an account</li>
                                <li>Phone number for verification purposes</li>
                                <li>Search preferences and settings</li>
                                <li>Usage data and interaction with our services</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. How We Use Your Information</h2>
                            <p className="mb-4">
                                We use the information we collect to:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Provide and maintain our services</li>
                                <li>Send notifications about matches for your searches</li>
                                <li>Improve and personalize your experience</li>
                                <li>Communicate with you about your account or our services</li>
                                <li>Protect against fraud and unauthorized access</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Information Sharing</h2>
                            <p>
                                We do not sell your personal information. We may share your information with:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 mt-4">
                                <li>Service providers who assist in our operations</li>
                                <li>Law enforcement when required by law</li>
                                <li>Other parties with your explicit consent</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Data Security</h2>
                            <p>
                                We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Your Rights</h2>
                            <p className="mb-4">
                                You have the right to:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Access your personal information</li>
                                <li>Correct inaccurate information</li>
                                <li>Request deletion of your information</li>
                                <li>Object to processing of your information</li>
                                <li>Withdraw consent</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Contact Us</h2>
                            <p>
                                If you have any questions about this Privacy Policy, please contact us at:
                                <a href="mailto:privacy@atrapo.com" className="text-blue-600 hover:text-blue-700 ml-1">
                                    privacy@atrapo.com
                                </a>
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Changes to This Policy</h2>
                            <p>
                                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
                            </p>
                        </section>

                        <div className="mt-8 pt-6 border-t border-gray-200 text-sm text-gray-500">
                            Last Updated: March 23, 2025
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}