"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export default function NewAssessmentWizard() {
  const router = useRouter()
  const [domain, setDomain] = useState('Programming')
  const [subdomains, setSubdomains] = useState('JavaScript, Algorithms')
  const [experience, setExperience] = useState('0-1')
  const [goals, setGoals] = useState('baseline')
  const [prefer, setPrefer] = useState('intermediate')
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState<any[]>([])

  const handlePlan = async () => {
    setLoading(true)
    try {
      const resp = await fetch('/api/assessments/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryDomain: domain,
          subdomains: subdomains.split(',').map(s => s.trim()).filter(Boolean),
          yearsExperience: experience,
          goals,
          preferredDifficulty: prefer
        })
      })
      const data = await resp.json()
      if (!resp.ok || !data?.data?.plan) throw new Error(data?.error || 'Plan failed')
      setPlan(data.data.plan)
      toast.success('Assessment plan created')
    } catch (e:any) {
      toast.error('Failed to create plan', { description: e.message })
    } finally {
      setLoading(false)
    }
  }

  const handleStart = async (p:any) => {
    router.push(`/assessments?planned=${encodeURIComponent(JSON.stringify(p))}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-800">
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-3xl text-white font-bold mb-4">Create Your Custom Assessment Plan</h1>
        <Card className="bg-slate-800/50 border-slate-600/30 p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-300">Primary Domain</label>
              <Input value={domain} onChange={e=>setDomain(e.target.value)} className="bg-slate-700 text-white" />
            </div>
            <div>
              <label className="text-sm text-gray-300">Subdomains (comma-separated)</label>
              <Input value={subdomains} onChange={e=>setSubdomains(e.target.value)} className="bg-slate-700 text-white" />
            </div>
            <div>
              <label className="text-sm text-gray-300">Years Experience</label>
              <Input value={experience} onChange={e=>setExperience(e.target.value)} className="bg-slate-700 text-white" />
            </div>
            <div>
              <label className="text-sm text-gray-300">Goal</label>
              <Input value={goals} onChange={e=>setGoals(e.target.value)} className="bg-slate-700 text-white" />
            </div>
            <div>
              <label className="text-sm text-gray-300">Preferred Difficulty</label>
              <Input value={prefer} onChange={e=>setPrefer(e.target.value)} className="bg-slate-700 text-white" />
            </div>
          </div>
          <div className="mt-4">
            <Button disabled={loading} onClick={handlePlan} className="bg-gradient-to-r from-cyan-500 to-blue-600">
              {loading ? 'Planning...' : 'Create Plan'}
            </Button>
          </div>
        </Card>

        {plan.length > 0 && (
          <div className="grid md:grid-cols-3 gap-4">
            {plan.map((p:any, i:number) => (
              <Card key={i} className="bg-slate-800/50 border-slate-600/30 p-4">
                <div className="text-white font-semibold mb-1">{p.title}</div>
                <div className="text-gray-300 text-sm mb-2">{p.description}</div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {(p.targetSkills||[]).map((t:string, idx:number)=>(<Badge key={idx} variant="outline" className="text-xs border-slate-600 text-gray-300">{t}</Badge>))}
                </div>
                <div className="text-gray-400 text-sm mb-1">Difficulty: {p.difficulty}</div>
                <div className="text-gray-400 text-sm mb-3">Questions: {p.questionCount} • ~{p.estimatedDurationMinutes}m</div>
                <Button onClick={()=>handleStart(p)} size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-600">Start</Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


