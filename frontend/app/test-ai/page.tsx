"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Sparkles, Target, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { MainNavigation } from "@/components/navigation/main-navigation";

export default function TestAIPage() {
  const { user, getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Mock user for navigation
  const mockUser = {
    name: user?.name || "Developer",
    avatar: user?.avatar || "/placeholder.svg?height=40&width=40",
    subscription: "premium" as const,
    notifications: 3,
  };

  const testAIEvaluation = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const token = await getToken();
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      // Test the AI evaluation with a simple assessment submission
      const testData = {
        sessionId: 'test-session-123',
        answers: {
          'q1': { answer: 'var myVariable;', timeSpent: 30 },
          'q2': { answer: 'push()', timeSpent: 25 },
          'q3': { answer: 'The == operator performs type coercion while === does not. For example: "5" == 5 returns true, but "5" === 5 returns false because one is a string and the other is a number.', timeSpent: 180 }
        }
      };

      const response = await fetch('/api/assessments/test-ai-evaluation', {
        method: 'POST',
        headers,
        body: JSON.stringify(testData)
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
      } else {
        throw new Error(`AI evaluation test failed: ${response.status}`);
      }
    } catch (err) {
      console.error('AI test error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-800">
      <MainNavigation user={mockUser} />
      
      <div className="container mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center">
            <Brain className="h-10 w-10 mr-4 text-cyan-400" />
            AI Evaluation System Test
          </h1>
          <p className="text-xl text-gray-300">
            Test the OpenAI-powered assessment evaluation system
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Test Controls */}
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Sparkles className="h-6 w-6 mr-3 text-purple-400" />
                AI Evaluation Test
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-300">
                This will test the AI evaluation system with sample JavaScript assessment answers.
              </p>
              
              <div className="space-y-2">
                <h4 className="text-white font-semibold">Test Questions:</h4>
                <div className="text-gray-300 space-y-1">
                  <p><strong>Q1:</strong> Variable declaration in JavaScript</p>
                  <p><strong>Q2:</strong> Array method for adding elements</p>
                  <p><strong>Q3:</strong> Difference between == and === operators</p>
                </div>
              </div>

              <Button 
                onClick={testAIEvaluation} 
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
              >
                {loading ? (
                  <>
                    <Brain className="h-4 w-4 mr-2 animate-spin" />
                    Running AI Evaluation...
                  </>
                ) : (
                  <>
                    <Target className="h-4 w-4 mr-2" />
                    Test AI Evaluation
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Card className="bg-red-500/20 border-red-500/30">
              <CardContent className="p-6">
                <h3 className="text-red-300 font-semibold mb-2">Error</h3>
                <p className="text-red-400">{error}</p>
                <p className="text-sm text-gray-400 mt-2">
                  Make sure the backend server is running and the AI evaluation service is configured.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Results Display */}
          {result && (
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/30 backdrop-blur-sm border border-slate-600/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <TrendingUp className="h-6 w-6 mr-3 text-green-400" />
                  AI Evaluation Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {result.data?.evaluation && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-cyan-400">
                        {result.data.evaluation.finalScore}%
                      </div>
                      <div className="text-gray-400">Final Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-400">
                        {result.data.evaluation.confidence}%
                      </div>
                      <div className="text-gray-400">AI Confidence</div>
                    </div>
                    <div className="text-center">
                      <Badge className={result.data.evaluation.passed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                        {result.data.evaluation.passed ? 'PASSED' : 'FAILED'}
                      </Badge>
                      <div className="text-gray-400 mt-1">Result</div>
                    </div>
                  </div>
                )}

                {result.data?.evaluation?.feedback && (
                  <div>
                    <h4 className="text-white font-semibold mb-3">AI Feedback</h4>
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <p className="text-gray-300">{result.data.evaluation.feedback}</p>
                    </div>
                  </div>
                )}

                {result.data?.evaluation?.recommendations && (
                  <div>
                    <h4 className="text-white font-semibold mb-3">Recommendations</h4>
                    <div className="space-y-2">
                      {result.data.evaluation.recommendations.map((rec: string, index: number) => (
                        <div key={index} className="flex items-start">
                          <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                            {index + 1}
                          </div>
                          <span className="text-gray-300">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-center">
                  <Badge className="bg-green-500/20 text-green-400">
                    ✅ AI Evaluation System Working
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}