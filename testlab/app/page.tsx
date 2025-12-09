import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">TestLab</h1>
          <p className="text-xl text-gray-600">SAT Practice Test Platform</p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Welcome</h2>
            <p className="text-gray-700 mb-6">
              TestLab helps you practice for the SAT with timed sections, instant scoring, and detailed review.
            </p>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3 mt-0.5">
                  1
                </div>
                <div>
                  <h3 className="font-semibold">Select a Test</h3>
                  <p className="text-gray-600 text-sm">Choose from available SAT practice tests</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3 mt-0.5">
                  2
                </div>
                <div>
                  <h3 className="font-semibold">Take Timed Sections</h3>
                  <p className="text-gray-600 text-sm">Complete each section within the time limit</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3 mt-0.5">
                  3
                </div>
                <div>
                  <h3 className="font-semibold">Review Your Answers</h3>
                  <p className="text-gray-600 text-sm">See explanations and filter by correct/incorrect questions</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/tests"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Browse Tests
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

