import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Check, X, Calendar, Clock, MapPin, Users, Building2, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export function AdminRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const response = await api.events.get();
      if (response.success && Array.isArray(response.data)) {
        // Filter for pending events (room requests)
        const pending = response.data.filter((e: any) => e.status === 'pending');
        setRequests(pending);
      }
    } catch (error) {
      console.error('Failed to fetch requests', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleStatusUpdate = async (id: number, status: 'active' | 'rejected') => {
    try {
      const response = await api.events.update({ id, status });
      if (response.success) {
        fetchRequests();
      }
    } catch (error) {
      console.error('Failed to update status', error);
    }
  };

  const getInitials = (name: string) => {
    return name ? name.split(' ').map(word => word.charAt(0).toUpperCase()).join('').slice(0, 2) : '??';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  return (
    <div className="space-y-6" style={{ padding: '24px' }}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
        <div>
          <h1>Venue Booking Requests</h1>
          <p className="text-muted-foreground" style={{ marginTop: '8px' }}>
            Review and approve classroom and amphitheater booking requests from teams
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchRequests} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="space-y-4" style={{ marginTop: '24px' }}>
        {requests.map((request) => (
          <Card key={request.id} className="border-0 shadow-sm" style={{ borderRadius: '10px' }}>
            <CardHeader style={{ paddingBottom: '16px' }}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3" style={{ marginBottom: '8px' }}>
                    <CardTitle className="text-lg" style={{ fontWeight: '500' }}>
                      {request.title}
                    </CardTitle>
                  </div>
                  <div className="flex items-center space-x-2" style={{ marginTop: '8px' }}>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      <Building2 className="h-3 w-3 mr-1" />
                      {request.location || 'Requested Room'}
                    </Badge>
                    <span className="text-sm text-muted-foreground">•</span>
                    <span className="text-sm" style={{ fontWeight: '500' }}>{request.team_name}</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  Pending Review
                </Badge>
              </div>
            </CardHeader>
            <CardContent style={{ paddingTop: '0' }}>
              <div className="space-y-4">
                {/* Venue and Date Information */}
                <div className="bg-gray-50 rounded-lg" style={{ padding: '16px' }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-start space-x-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" style={{ marginTop: '2px' }} />
                        <div>
                          <p className="text-xs text-muted-foreground">Venue</p>
                          <p className="text-sm" style={{ fontWeight: '500' }}>{request.location}</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" style={{ marginTop: '2px' }} />
                        <div>
                          <p className="text-xs text-muted-foreground">Date</p>
                          <p className="text-sm" style={{ fontWeight: '500' }}>{formatDate(request.date)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" style={{ marginTop: '2px' }} />
                        <div>
                          <p className="text-xs text-muted-foreground">Time Slot</p>
                          <p className="text-sm" style={{ fontWeight: '500' }}>{request.start_time} - {request.end_time}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <p className="text-sm text-muted-foreground">
                    {request.description}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end" style={{ paddingTop: '16px', borderTop: '1px solid hsl(var(--border))' }}>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      style={{ fontWeight: '500' }}
                      onClick={() => handleStatusUpdate(request.id, 'rejected')}
                    >
                      <X className="h-4 w-4" style={{ marginRight: '4px' }} />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                      style={{ fontWeight: '500' }}
                      onClick={() => handleStatusUpdate(request.id, 'active')}
                    >
                      <Check className="h-4 w-4" style={{ marginRight: '4px' }} />
                      Approve
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {requests.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex items-center justify-center" style={{ padding: '48px' }}>
            <div className="text-center space-y-2">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground" style={{ fontWeight: '500' }}>No pending booking requests</p>
              <p className="text-sm text-muted-foreground">
                Venue booking requests from teams will appear here
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
