import React, { useState, useEffect } from "react";
import { Sparkles, Loader2, Copy, Check, Video, Hash, FileText, Film, ChevronDown, ChevronUp, Trash2, Clock } from "lucide-react";
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
  const [savedIdeas, setSavedIdeas] = useState([]);
  const [expandedIdeas, setExpandedIdeas] = useState({});

  // Load saved ideas from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("contentCreatorIdeas");
    if (saved) {
      try {
        setSavedIdeas(JSON.parse(saved));
      } catch (err) {
        console.error("Error loading saved ideas:", err);
      }
    }
  }, []);

  // Save ideas to localStorage whenever they change
  useEffect(() => {
    if (savedIdeas.length > 0) {
      localStorage.setItem("contentCreatorIdeas", JSON.stringify(savedIdeas));
    }
  }, [savedIdeas]);

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
      
      // Save to list
      const newIdea = {
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        hook: data.hook,
        caption: data.caption,
        hashtags: data.hashtags || [],
        storyboardShots: data.storyboardShots || [],
        metadata: {
          niche,
          platform,
          format,
          videoDescription,
          igUrl: igUrl || null,
        },
      };
      
      setSavedIdeas(prev => [newIdea, ...prev]);
      
      // Clear form after successful generation
      setVideoDescription("");
      setIgUrl("");
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

  const toggleExpand = (id) => {
    setExpandedIdeas(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const deleteIdea = (id) => {
    if (window.confirm("Are you sure you want to delete this idea?")) {
      setSavedIdeas(prev => prev.filter(idea => idea.id !== id));
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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

        {/* Saved Ideas List */}
        {savedIdeas.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Saved Ideas ({savedIdeas.length})
              </CardTitle>
              <CardDescription>
                Previously generated content ideas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {savedIdeas.map((idea) => {
                  const isExpanded = expandedIdeas[idea.id];
                  return (
                    <div
                      key={idea.id}
                      className="border rounded-lg overflow-hidden bg-white"
                    >
                      <div
                        className="p-4 cursor-pointer hover:bg-slate-50 flex items-center justify-between"
                        onClick={() => toggleExpand(idea.id)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-gray-900 line-clamp-1">
                              {idea.hook}
                            </p>
                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                              {idea.metadata.niche}
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                              {idea.metadata.platform}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            {formatDate(idea.createdAt)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteIdea(idea.id);
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <div className="border-t bg-slate-50 p-4 space-y-4">
                          {/* Hook */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <Label className="text-sm font-medium flex items-center gap-2">
                                <Video className="h-3 w-3" />
                                Hook
                              </Label>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(idea.hook, `hook-${idea.id}`)}
                              >
                                {copied[`hook-${idea.id}`] ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                            <p className="text-sm font-semibold text-gray-900">{idea.hook}</p>
                          </div>

                          {/* Caption */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <Label className="text-sm font-medium flex items-center gap-2">
                                <FileText className="h-3 w-3" />
                                Caption
                              </Label>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(idea.caption, `caption-${idea.id}`)}
                              >
                                {copied[`caption-${idea.id}`] ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                            <p className="text-sm whitespace-pre-line text-gray-700">{idea.caption}</p>
                          </div>

                          {/* Hashtags */}
                          {idea.hashtags && idea.hashtags.length > 0 && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <Label className="text-sm font-medium flex items-center gap-2">
                                  <Hash className="h-3 w-3" />
                                  Hashtags
                                </Label>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyToClipboard(idea.hashtags.join(" "), `hashtags-${idea.id}`)}
                                >
                                  {copied[`hashtags-${idea.id}`] ? (
                                    <Check className="h-3 w-3" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {idea.hashtags.map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-block px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Storyboard */}
                          {idea.storyboardShots && idea.storyboardShots.length > 0 && (
                            <div>
                              <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                                <Film className="h-3 w-3" />
                                Storyboard ({idea.storyboardShots.length} shots)
                              </Label>
                              <div className="space-y-2">
                                {idea.storyboardShots.map((shot, idx) => (
                                  <div
                                    key={idx}
                                    className="border rounded p-3 bg-white"
                                  >
                                    <div className="flex items-start gap-2">
                                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center font-semibold text-xs">
                                        {idx + 1}
                                      </div>
                                      <div className="flex-1 space-y-1">
                                        <div>
                                          <p className="text-xs font-medium text-gray-500">Visual:</p>
                                          <p className="text-sm text-gray-900">{shot.visual}</p>
                                        </div>
                                        <div>
                                          <p className="text-xs font-medium text-gray-500">Text on Screen:</p>
                                          <p className="text-sm text-gray-900 font-semibold">{shot.textOnScreen}</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Metadata */}
                          <div className="pt-2 border-t">
                            <p className="text-xs text-gray-500 mb-1">Original Description:</p>
                            <p className="text-xs text-gray-600 italic">{idea.metadata.videoDescription}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

