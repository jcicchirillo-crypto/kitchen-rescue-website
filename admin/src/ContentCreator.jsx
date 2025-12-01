import React, { useState } from "react";
import { Sparkles, Loader2, Copy, Check, Video, Hash, FileText, Film } from "lucide-react";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";

export default function ContentCreator() {
  const [igUrl, setIgUrl] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [format, setFormat] = useState("Instagram Reel");
  const [niche, setNiche] = useState("Kitchen Rescue");
  const [platform, setPlatform] = useState("Instagram Reel");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState({});

  const handleGenerate = async () => {
    if (!videoDescription.trim()) {
      setError("Please enter a video description");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/generate-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({
          igUrl,
          videoDescription,
          format,
          niche,
          platform,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate content");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error("Error generating content:", err);
      setError(err.message || "Failed to generate content. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied({ ...copied, [key]: true });
    setTimeout(() => {
      setCopied({ ...copied, [key]: false });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="mx-auto max-w-6xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Content Creator Organizer
            </CardTitle>
            <CardDescription>
              Transform video ideas into social media content for Kitchen Rescue or Golf
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="igUrl">Instagram URL (optional)</Label>
                <Input
                  id="igUrl"
                  placeholder="https://instagram.com/p/..."
                  value={igUrl}
                  onChange={(e) => setIgUrl(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="format">Format</Label>
                <Input
                  id="format"
                  placeholder="e.g., Instagram Reel, TikTok, YouTube Short"
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="niche">Niche</Label>
                <select
                  id="niche"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                >
                  <option value="Kitchen Rescue">Kitchen Rescue</option>
                  <option value="Golf">Golf</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <select
                  id="platform"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                >
                  <option value="Instagram Reel">Instagram Reel</option>
                  <option value="TikTok">TikTok</option>
                  <option value="YouTube Short">YouTube Short</option>
                  <option value="Instagram Post">Instagram Post</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="videoDescription">Video Description *</Label>
              <textarea
                id="videoDescription"
                className="flex min-h-[120px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Describe the video style, format, pacing, and any key elements you want to replicate..."
                value={videoDescription}
                onChange={(e) => setVideoDescription(e.target.value)}
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Content
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-4">
            {/* Hook */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Video className="h-4 w-4" />
                  Hook
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start justify-between gap-4">
                  <p className="text-lg font-semibold text-gray-900">{result.hook}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(result.hook, "hook")}
                  >
                    {copied.hook ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Caption */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-4 w-4" />
                  Caption
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start justify-between gap-4">
                  <p className="whitespace-pre-line text-gray-700">{result.caption}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(result.caption, "caption")}
                  >
                    {copied.caption ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Hashtags */}
            {result.hashtags && result.hashtags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Hash className="h-4 w-4" />
                    Hashtags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-wrap gap-2">
                      {result.hashtags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(result.hashtags.join(" "), "hashtags")}
                    >
                      {copied.hashtags ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Storyboard */}
            {result.storyboardShots && result.storyboardShots.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Film className="h-4 w-4" />
                    Storyboard ({result.storyboardShots.length} shots)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {result.storyboardShots.map((shot, idx) => (
                      <div
                        key={idx}
                        className="border rounded-lg p-4 bg-slate-50"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center font-semibold">
                            {idx + 1}
                          </div>
                          <div className="flex-1 space-y-2">
                            <div>
                              <p className="text-sm font-medium text-gray-500">Visual:</p>
                              <p className="text-gray-900">{shot.visual}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Text on Screen:</p>
                              <p className="text-gray-900 font-semibold">{shot.textOnScreen}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

