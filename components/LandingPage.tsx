import React from 'react';
import { ClipboardList, Package } from 'lucide-react';

interface LandingPageProps {
    onSelectSimple: () => void;
    onSelectCatalog: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSelectSimple, onSelectCatalog }) => {
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4 tracking-tight">
                    Welcome to Xinya Frozen
                </h1>
                <p className="text-lg text-gray-600">Please select your ordering mode</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
                {/* Simple Order Form Card */}
                <button
                    onClick={onSelectSimple}
                    className="group relative bg-white p-8 rounded-3xl shadow-xl border-2 border-transparent hover:border-blue-500 transition-all duration-300 hover:shadow-2xl flex flex-col items-center text-center space-y-6"
                >
                    <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <ClipboardList size={48} className="text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Simple Order Form</h2>
                        <p className="text-gray-500">
                            Quickly submit orders by typing product names. Best for our employees to order what we need.
                        </p>
                    </div>
                    <div className="w-full py-3 bg-blue-50 text-blue-600 rounded-xl font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        Enter Simple Mode
                    </div>
                </button>

                {/* Order Catalog Card */}
                <button
                    onClick={onSelectCatalog}
                    className="group relative bg-white p-8 rounded-3xl shadow-xl border-2 border-transparent hover:border-purple-500 transition-all duration-300 hover:shadow-2xl flex flex-col items-center text-center space-y-6"
                >
                    <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Package size={48} className="text-purple-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Catalog</h2>
                        <p className="text-gray-500">
                            Browse our full product catalog with images, search, and filters. Best for exploring new items.
                        </p>
                    </div>
                    <div className="w-full py-3 bg-purple-50 text-purple-600 rounded-xl font-bold group-hover:bg-purple-600 group-hover:text-white transition-colors">
                        Enter Catalog Mode
                    </div>
                </button>
            </div>
        </div>
    );
};

export default LandingPage;
