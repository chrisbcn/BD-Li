import { useState, useEffect } from 'react';
import { useContacts } from '../hooks/useContacts';
import { Contact } from '../types/Contact';
import { calculateLeadScore, Temperature } from '../services/leadScoringService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Mail, Phone, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

export function AnalyticsDashboard() {
  const { contacts, isLoading } = useContacts();
  const [temperatureDistribution, setTemperatureDistribution] = useState<{ name: string; value: number; color: string }[]>([]);
  const [leadScoreStats, setLeadScoreStats] = useState({ average: 0, hot: 0, warm: 0, cold: 0 });

  useEffect(() => {
    const calculateStats = async () => {
      if (contacts.length === 0) return;

      const scores = new Map<string, { score: number; temperature: Temperature }>();
      let totalScore = 0;
      const tempCounts = { hot: 0, warm: 0, cold: 0 };

      for (const contact of contacts) {
        try {
          const leadScore = await calculateLeadScore(contact);
          scores.set(contact.id, {
            score: leadScore.total,
            temperature: leadScore.temperature,
          });
          totalScore += leadScore.total;
          tempCounts[leadScore.temperature]++;
        } catch (error) {
          console.error(`Error calculating score for ${contact.id}:`, error);
        }
      }

      setTemperatureDistribution([
        { name: 'Hot', value: tempCounts.hot, color: '#ef4444' },
        { name: 'Warm', value: tempCounts.warm, color: '#eab308' },
        { name: 'Cold', value: tempCounts.cold, color: '#3b82f6' },
      ]);

      setLeadScoreStats({
        average: Math.round(totalScore / contacts.length),
        hot: tempCounts.hot,
        warm: tempCounts.warm,
        cold: tempCounts.cold,
      });
    };

    if (!isLoading) {
      calculateStats();
    }
  }, [contacts, isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Insights into your contact relationships and pipeline
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contacts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Lead Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leadScoreStats.average}</div>
            <p className="text-xs text-muted-foreground">Out of 100</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hot Leads</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{leadScoreStats.hot}</div>
            <p className="text-xs text-muted-foreground">
              {contacts.length > 0
                ? Math.round((leadScoreStats.hot / contacts.length) * 100)
                : 0}
              % of contacts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warm Leads</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{leadScoreStats.warm}</div>
            <p className="text-xs text-muted-foreground">
              {contacts.length > 0
                ? Math.round((leadScoreStats.warm / contacts.length) * 100)
                : 0}
              % of contacts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Temperature Distribution</CardTitle>
            <CardDescription>Breakdown of contacts by temperature</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={temperatureDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {temperatureDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Temperature Breakdown</CardTitle>
            <CardDescription>Number of contacts by temperature</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={temperatureDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8">
                  {temperatureDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

