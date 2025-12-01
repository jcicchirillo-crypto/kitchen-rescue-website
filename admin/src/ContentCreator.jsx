import React, { useState, useEffect } from "react";
import { Sparkles, Loader2, Copy, Check, Video, Hash, FileText, Film, ChevronDown, ChevronUp, Trash2, Clock, Image, Play, Smartphone, Plus, Download, Instagram } from "lucide-react";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";

export default function ContentCreator() {
  const [igUrl, setIgUrl] = useState("");
  const [hook, setHook] = useState("");
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
  const [visuals, setVisuals] = useState({ photos: [], videos: [] });
  const [loadingVisuals, setLoadingVisuals] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

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
    setVisuals({ photos: [], videos: [] });
    setSelectedImage(null);

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

      const responseData = await response.json();
      
      // Parse the content if it's in the new format (plain text with sections)
      let parsedData;
      if (responseData.content) {
        // New format: parse sections from plain text
        const content = responseData.content;
        
        // More robust parsing - handle quotes and whitespace
        const hookMatch = content.match(/\[HOOK\]\s*\n?\s*(.+?)(?=\n\s*\[|$)/s);
        const explanationMatch = content.match(/\[EXPLANATION\]\s*\n?\s*(.+?)(?=\n\s*\[|$)/s);
        const reelMatch = content.match(/\[REEL IDEA\]\s*\n?\s*(.+?)(?=\n\s*\[|$)/s);
        const onScreenMatch = content.match(/\[ON-SCREEN TEXT\]\s*\n?\s*(.+?)(?=\n\s*\[|$)/s);
        const captionMatch = content.match(/\[CAPTION\]\s*\n?\s*(.+?)(?=\n\s*\[|$)/s);
        
        // Clean up hook - remove quotes if present
        let extractedHook = hookMatch ? hookMatch[1].trim() : "";
        if (extractedHook.startsWith('"') && extractedHook.endsWith('"')) {
          extractedHook = extractedHook.slice(1, -1);
        }
        // Also remove single quotes
        if (extractedHook.startsWith("'") && extractedHook.endsWith("'")) {
          extractedHook = extractedHook.slice(1, -1);
        }
        
        parsedData = {
          hook: extractedHook || "", // Will use provided hook as fallback below
          explanation: explanationMatch ? explanationMatch[1].trim() : "",
          reelIdea: reelMatch ? reelMatch[1].trim() : "",
          onScreenText: onScreenMatch ? onScreenMatch[1].trim() : "",
          caption: captionMatch ? captionMatch[1].trim() : "",
          hashtags: [], // Will be extracted from caption if needed
          storyboardShots: [],
          visualSearchKeywords: [],
        };
      } else {
        // Old format: already structured
        parsedData = responseData;
      }
      
      // CRITICAL: If user provided a hook, always use it (even if API returned something different)
      if (hook && hook.trim()) {
        console.log("Using provided hook:", hook.trim());
        parsedData.hook = hook.trim();
      }
      
      setResult(parsedData);
      
      // Extract hashtags from caption if not provided
      if (parsedData.caption && (!parsedData.hashtags || parsedData.hashtags.length === 0)) {
        const hashtagRegex = /#\w+/g;
        const foundHashtags = parsedData.caption.match(hashtagRegex) || [];
        parsedData.hashtags = foundHashtags;
      }
      
      // Generate visual search keywords from hook and description
      const searchKeywords = [];
      if (parsedData.hook) {
        // Extract key words from hook
        const hookWords = parsedData.hook.toLowerCase()
          .replace(/[^\w\s]/g, ' ')
          .split(/\s+/)
          .filter(w => w.length > 4)
          .slice(0, 3);
        searchKeywords.push(...hookWords);
      }
      if (videoDescription) {
        const descWords = videoDescription.toLowerCase()
          .replace(/[^\w\s]/g, ' ')
          .split(/\s+/)
          .filter(w => w.length > 4)
          .slice(0, 2);
        searchKeywords.push(...descWords);
      }
      
      // Search for visuals if keywords available
      let fetchedVisuals = { photos: [], videos: [] };
      let fetchedSelectedImage = null;
      
      if (searchKeywords.length > 0) {
        const photosResult = await searchVisuals(searchKeywords, "photos");
        const videosResult = await searchVisuals(searchKeywords, "videos");
        
        if (photosResult) {
          fetchedVisuals.photos = photosResult.photos || [];
          fetchedSelectedImage = photosResult.selectedImage || null;
        }
        if (videosResult) {
          fetchedVisuals.videos = videosResult.videos || [];
        }
      }
      
      // Save to list with the fetched visuals
      const newIdea = {
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        hook: parsedData.hook,
        caption: parsedData.caption,
        explanation: parsedData.explanation,
        reelIdea: parsedData.reelIdea,
        onScreenText: parsedData.onScreenText,
        hashtags: parsedData.hashtags || [],
        storyboardShots: parsedData.storyboardShots || [],
        visualSearchKeywords: searchKeywords,
        visuals: fetchedVisuals,
        selectedImage: fetchedSelectedImage,
        metadata: {
          niche,
          platform,
          format,
          videoDescription,
          hook: hook || null,
          igUrl: igUrl || null,
        },
      };
      
      setSavedIdeas(prev => [newIdea, ...prev]);
      
      // Clear form after successful generation
      setVideoDescription("");
      setHook("");
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

  const searchVisuals = async (keywords, type = "photos") => {
    if (!keywords || keywords.length === 0) return null;
    
    setLoadingVisuals(true);
    try {
      // Use multiple keywords or randomly select for variation
      let query;
      if (Array.isArray(keywords) && keywords.length > 0) {
        // Use a random keyword or combine first 2 for more variety
        const randomIndex = Math.floor(Math.random() * keywords.length);
        query = keywords[randomIndex];
        // Sometimes combine with another keyword for more specific results
        if (keywords.length > 1 && Math.random() > 0.5) {
          const secondIndex = (randomIndex + 1) % keywords.length;
          query = `${query} ${keywords[secondIndex]}`;
        }
      } else {
        query = keywords;
      }
      
      const response = await fetch("/api/search-visuals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({
          query,
          type,
          perPage: 6,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to search visuals");
      }

      const data = await response.json();
      
      // Update state for UI
      if (type === "videos") {
        setVisuals(prev => ({ ...prev, videos: data.videos || [] }));
        return { videos: data.videos || [] };
      } else {
        setVisuals(prev => ({ ...prev, photos: data.photos || [] }));
        // Auto-select first image for mobile preview
        if (data.photos && data.photos.length > 0) {
          setSelectedImage(data.photos[0]);
          return { photos: data.photos || [], selectedImage: data.photos[0] };
        }
        return { photos: data.photos || [] };
      }
    } catch (err) {
      console.error("Error searching visuals:", err);
      return null;
    } finally {
      setLoadingVisuals(false);
    }
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

  const downloadImage = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename || `kitchen-rescue-post-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Error downloading image:", err);
      alert("Failed to download image. Please try right-clicking and saving the image instead.");
    }
  };

  const copyToInstagram = (idea) => {
    const hook = idea.hook || "";
    const caption = idea.caption || "";
    const hashtags = idea.hashtags ? idea.hashtags.join(" ") : "";
    
    let formatted = "";
    if (hook) {
      formatted += hook + "\n\n";
    }
    if (caption) {
      formatted += caption;
      if (hashtags) {
        formatted += "\n\n";
      }
    }
    if (hashtags) {
      formatted += hashtags;
    }
    
    navigator.clipboard.writeText(formatted);
    const key = idea.id ? `instagram-${idea.id}` : "instagram";
    setCopied({ ...copied, [key]: true });
    setTimeout(() => {
      setCopied({ ...copied, [key]: false });
    }, 2000);
  };

  const openInstagram = () => {
    window.open("https://www.instagram.com/create", "_blank");
  };

  const handleNewIdea = () => {
    // Save current result to list if it exists
    if (result) {
      const newIdea = {
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        hook: result.hook,
        caption: result.caption,
        explanation: result.explanation,
        reelIdea: result.reelIdea,
        onScreenText: result.onScreenText,
        hashtags: result.hashtags || [],
        storyboardShots: result.storyboardShots || [],
        visualSearchKeywords: result.visualSearchKeywords || [],
        visuals: visuals,
        selectedImage: selectedImage,
        metadata: {
          niche,
          platform,
          format,
          videoDescription: videoDescription || "",
          hook: hook || null,
          igUrl: igUrl || null,
        },
      };
      setSavedIdeas(prev => [newIdea, ...prev]);
    }

    // Clear all form fields
    setVideoDescription("");
    setHook("");
    setIgUrl("");
    setFormat("Instagram Reel");
    setNiche("Kitchen Rescue");
    setPlatform("Instagram Reel");
    
    // Clear result and visuals
    setResult(null);
    setVisuals({ photos: [], videos: [] });
    setSelectedImage(null);
    setError("");
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
              <Label htmlFor="hook">Custom hook (optional – leave blank if you want one generated)</Label>
              <Input
                id="hook"
                placeholder="e.g., The hidden cost nobody tells you about when you rip out your kitchen…"
                value={hook}
                onChange={(e) => setHook(e.target.value)}
              />
              <p className="text-xs text-gray-500">If you provide a hook, it will be used exactly as written. If left blank, a hook will be generated from your description.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="videoDescription">Idea / description (required)</Label>
              <textarea
                id="videoDescription"
                className="flex min-h-[120px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="e.g., talk about takeaways, laundrette, stress OR people don't budget for takeaways, laundrettes, and the stress when they rip out their kitchen"
                value={videoDescription}
                onChange={(e) => setVideoDescription(e.target.value)}
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleGenerate}
                disabled={loading}
                className="flex-1"
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
              {(result || videoDescription.trim() || igUrl.trim()) && (
                <Button
                  onClick={handleNewIdea}
                  disabled={loading}
                  variant="outline"
                  className="flex-1"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Idea
                </Button>
              )}
            </div>
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

            {/* Explanation */}
            {result.explanation && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-4 w-4" />
                    Explanation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-line">{result.explanation}</p>
                </CardContent>
              </Card>
            )}

            {/* Reel Idea */}
            {result.reelIdea && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Film className="h-4 w-4" />
                    Reel Idea
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-line">{result.reelIdea}</p>
                </CardContent>
              </Card>
            )}

            {/* On-Screen Text */}
            {result.onScreenText && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Video className="h-4 w-4" />
                    On-Screen Text
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-line">{result.onScreenText}</p>
                </CardContent>
              </Card>
            )}

            {/* Caption */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-4 w-4" />
                  Caption
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
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
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToInstagram({ hook: result.hook, caption: result.caption, hashtags: result.hashtags })}
                      className="gap-2"
                    >
                      {copied.instagram ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Instagram className="h-4 w-4" />
                          Copy All for Instagram
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openInstagram}
                      className="gap-2"
                    >
                      <Instagram className="h-4 w-4" />
                      Open Instagram
                    </Button>
                  </div>
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

            {/* Mobile Preview */}
            {result && selectedImage && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Smartphone className="h-4 w-4" />
                    Mobile Preview
                  </CardTitle>
                  <CardDescription>
                    How your post will look on mobile
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <div className="relative" style={{ width: "375px", maxWidth: "100%" }}>
                        {/* iPhone frame */}
                        <div className="bg-black rounded-[2.5rem] p-2 shadow-2xl">
                          <div className="bg-white rounded-[2rem] overflow-hidden">
                            {/* Status bar */}
                            <div className="bg-white h-6 flex items-center justify-between px-4 text-xs text-black">
                              <span>9:41</span>
                              <div className="flex items-center gap-1">
                                <div className="w-4 h-2 border border-black rounded-sm"></div>
                                <div className="w-6 h-3 border-2 border-black rounded-sm"></div>
                              </div>
                            </div>
                            
                            {/* Image */}
                            <div className="relative aspect-[4/5] bg-gray-100">
                              <img
                                src={selectedImage.url}
                                alt="Post preview"
                                className="w-full h-full object-cover"
                              />
                              {/* Hook overlay */}
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-6">
                                <p className="text-white text-xl font-bold leading-tight drop-shadow-lg">
                                  {result.hook}
                                </p>
                              </div>
                            </div>
                            
                            {/* Caption area */}
                            <div className="p-4 bg-white">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-full bg-red-600"></div>
                                <span className="font-semibold text-sm">kitchenrescue</span>
                              </div>
                              <p className="text-sm text-gray-800 whitespace-pre-line line-clamp-3">
                                {result.caption}
                              </p>
                              {result.hashtags && result.hashtags.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {result.hashtags.slice(0, 3).map((tag, idx) => (
                                    <span key={idx} className="text-xs text-blue-600">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Export buttons */}
                    <div className="flex flex-wrap gap-2 justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadImage(selectedImage.url, `kitchen-rescue-post-${Date.now()}.jpg`)}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download Image
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToInstagram({ hook: result.hook, caption: result.caption, hashtags: result.hashtags })}
                        className="gap-2"
                      >
                        {copied.instagram ? (
                          <>
                            <Check className="h-4 w-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Copy to Instagram
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={openInstagram}
                        className="gap-2"
                      >
                        <Instagram className="h-4 w-4" />
                        Open Instagram
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Visual Suggestions */}
            {(visuals.photos.length > 0 || visuals.videos.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Image className="h-4 w-4" />
                    Visual Suggestions
                  </CardTitle>
                  <CardDescription>
                    Click an image to preview it in mobile view
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingVisuals && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                  )}
                  
                  {visuals.photos.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Image className="h-4 w-4" />
                        Stock Photos
                      </h4>
                      <div className="grid grid-cols-3 gap-3">
                        {visuals.photos.map((photo) => (
                          <button
                            key={photo.id}
                            onClick={() => setSelectedImage(photo)}
                            className={`group relative block rounded-lg overflow-hidden border-2 transition ${
                              selectedImage?.id === photo.id
                                ? "border-red-600 ring-2 ring-red-200"
                                : "border-gray-200 hover:border-red-400"
                            }`}
                          >
                            <img
                              src={photo.thumbnail}
                              alt={`Photo by ${photo.photographer}`}
                              className="w-full h-32 object-cover"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition"></div>
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 px-2 opacity-0 group-hover:opacity-100 transition">
                              {photo.photographer}
                            </div>
                            <a
                              href={photo.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="absolute top-1 right-1 bg-white/90 hover:bg-white rounded px-1.5 py-0.5 text-xs opacity-0 group-hover:opacity-100 transition"
                            >
                              View
                            </a>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {visuals.videos.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Play className="h-4 w-4" />
                        Stock Videos
                      </h4>
                      <div className="grid grid-cols-3 gap-3">
                        {visuals.videos.map((video) => (
                          <a
                            key={video.id}
                            href={video.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative block rounded-lg overflow-hidden border border-gray-200 hover:border-red-600 transition"
                          >
                            <img
                              src={video.thumbnail}
                              alt={`Video by ${video.photographer}`}
                              className="w-full h-32 object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center">
                                <Play className="h-6 w-6 text-white ml-1" />
                              </div>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 px-2 opacity-0 group-hover:opacity-100 transition">
                              {video.photographer} • {video.duration}s
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
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

                          {/* Mobile Preview for Saved Idea */}
                          {idea.selectedImage && (
                            <div>
                              <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                                <Smartphone className="h-3 w-3" />
                                Mobile Preview
                              </Label>
                              <div className="space-y-3">
                                <div className="flex justify-center">
                                  <div className="relative" style={{ width: "300px", maxWidth: "100%" }}>
                                    <div className="bg-black rounded-[2rem] p-1.5 shadow-xl">
                                      <div className="bg-white rounded-[1.5rem] overflow-hidden">
                                        <div className="relative aspect-[4/5] bg-gray-100">
                                          <img
                                            src={idea.selectedImage.url}
                                            alt="Post preview"
                                            className="w-full h-full object-cover"
                                          />
                                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-4">
                                            <p className="text-white text-lg font-bold leading-tight drop-shadow-lg">
                                              {idea.hook}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-2 justify-center">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => downloadImage(idea.selectedImage.url, `kitchen-rescue-post-${idea.id}.jpg`)}
                                    className="gap-2 text-xs"
                                  >
                                    <Download className="h-3 w-3" />
                                    Download
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => copyToInstagram(idea)}
                                    className="gap-2 text-xs"
                                  >
                                    {copied[`instagram-${idea.id}`] ? (
                                      <>
                                        <Check className="h-3 w-3" />
                                        Copied!
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="h-3 w-3" />
                                        Copy for IG
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={openInstagram}
                                    className="gap-2 text-xs"
                                  >
                                    <Instagram className="h-3 w-3" />
                                    Open IG
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Visual Suggestions for Saved Idea */}
                          {idea.visuals && (idea.visuals.photos?.length > 0 || idea.visuals.videos?.length > 0) && (
                            <div>
                              <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                                <Image className="h-3 w-3" />
                                Visual Suggestions
                              </Label>
                              {idea.visuals.photos && idea.visuals.photos.length > 0 && (
                                <div className="mb-3">
                                  <p className="text-xs text-gray-600 mb-2">Stock Photos</p>
                                  <div className="grid grid-cols-3 gap-2">
                                    {idea.visuals.photos.map((photo) => (
                                      <a
                                        key={photo.id}
                                        href={photo.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group relative block rounded-lg overflow-hidden border border-gray-200 hover:border-red-400 transition"
                                      >
                                        <img
                                          src={photo.thumbnail}
                                          alt={`Photo by ${photo.photographer}`}
                                          className="w-full h-24 object-cover"
                                        />
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 opacity-0 group-hover:opacity-100 transition">
                                          {photo.photographer}
                                        </div>
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {idea.visuals.videos && idea.visuals.videos.length > 0 && (
                                <div>
                                  <p className="text-xs text-gray-600 mb-2">Stock Videos</p>
                                  <div className="grid grid-cols-3 gap-2">
                                    {idea.visuals.videos.map((video) => (
                                      <a
                                        key={video.id}
                                        href={video.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group relative block rounded-lg overflow-hidden border border-gray-200 hover:border-red-400 transition"
                                      >
                                        <img
                                          src={video.thumbnail}
                                          alt={`Video by ${video.photographer}`}
                                          className="w-full h-24 object-cover"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                          <div className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center">
                                            <Play className="h-4 w-4 text-white ml-0.5" />
                                          </div>
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 opacity-0 group-hover:opacity-100 transition">
                                          {video.photographer}
                                        </div>
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Export Section */}
                          <div className="pt-2 border-t">
                            <div className="flex flex-wrap gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToInstagram(idea)}
                                className="gap-2 text-xs"
                              >
                                {copied[`instagram-${idea.id}`] ? (
                                  <>
                                    <Check className="h-3 w-3" />
                                    Copied!
                                  </>
                                ) : (
                                  <>
                                    <Instagram className="h-3 w-3" />
                                    Copy All for Instagram
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={openInstagram}
                                className="gap-2 text-xs"
                              >
                                <Instagram className="h-3 w-3" />
                                Open Instagram
                              </Button>
                            </div>
                          </div>

                          {/* Metadata */}
                          <div className="pt-2 border-t space-y-2">
                            {idea.metadata.videoDescription && (
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Original Description:</p>
                                <p className="text-xs text-gray-600 italic">{idea.metadata.videoDescription}</p>
                              </div>
                            )}
                            {idea.metadata.hook && (
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Custom Hook Provided:</p>
                                <p className="text-xs text-gray-600 italic">{idea.metadata.hook}</p>
                              </div>
                            )}
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

