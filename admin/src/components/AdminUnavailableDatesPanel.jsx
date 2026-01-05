import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Calendar, X, Plus } from "lucide-react";

export default function AdminUnavailableDatesPanel() {
  const [unavailableRanges, setUnavailableRanges] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUnavailableDates();
  }, []);

  const fetchUnavailableDates = async () => {
    try {
      const response = await fetch("/assets/availability.json");
      if (response.ok) {
        const data = await response.json();
        setUnavailableRanges(data.unavailable || []);
      }
    } catch (error) {
      console.error("Error fetching unavailable dates:", error);
    }
  };

  const addRange = async () => {
    if (!startDate || !endDate) {
      alert("Please select both start and end dates");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      alert("Start date must be before end date");
      return;
    }

    setLoading(true);
    const newRange = { start: startDate, end: endDate };
    const updatedRanges = [...unavailableRanges, newRange];

    try {
      // In a real implementation, you'd call an API endpoint to update the JSON file
      // For now, this is a placeholder
      console.log("Would update unavailable dates:", updatedRanges);
      setUnavailableRanges(updatedRanges);
      setStartDate("");
      setEndDate("");
    } catch (error) {
      console.error("Error updating unavailable dates:", error);
      alert("Failed to update unavailable dates");
    } finally {
      setLoading(false);
    }
  };

  const removeRange = (index) => {
    const updated = unavailableRanges.filter((_, i) => i !== index);
    setUnavailableRanges(updated);
    // In a real implementation, you'd call an API endpoint to update
    console.log("Would remove range:", index);
  };

  const clearAll = () => {
    if (confirm("Are you sure you want to clear all unavailable dates?")) {
      setUnavailableRanges([]);
      // In a real implementation, you'd call an API endpoint to clear
      console.log("Would clear all ranges");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Manage Unavailable Dates
        </CardTitle>
        <CardDescription>
          Add date ranges to block out bookings on the availability calendar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={addRange} disabled={loading} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Range
          </Button>
          <Button variant="outline" onClick={clearAll}>
            Clear All
          </Button>
        </div>

        {unavailableRanges.length > 0 && (
          <div className="space-y-2">
            <Label>Unavailable Ranges</Label>
            <div className="space-y-2">
              {unavailableRanges.map((range, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 border rounded-md"
                >
                  <span className="text-sm">
                    {new Date(range.start).toLocaleDateString()} -{" "}
                    {new Date(range.end).toLocaleDateString()}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRange(index)}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

