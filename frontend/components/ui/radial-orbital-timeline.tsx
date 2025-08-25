"use client";
import { useState, useEffect, useRef } from "react";
import { ArrowRight, Link, Zap, Brain, Target, Award, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TimelineItem {
  id: number;
  title: string;
  date: string;
  content: string;
  category: string;
  icon: React.ElementType;
  relatedIds: number[];
  status: "completed" | "in-progress" | "pending";
  energy: number;
  color: string;
}

interface RadialOrbitalTimelineProps {
  timelineData: TimelineItem[];
}

export default function RadialOrbitalTimeline({
  timelineData,
}: RadialOrbitalTimelineProps) {
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>(
    {}
  );
  const [viewMode, setViewMode] = useState<"orbital">("orbital");
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [pulseEffect, setPulseEffect] = useState<Record<number, boolean>>({});
  const [centerOffset, setCenterOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [activeNodeId, setActiveNodeId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === containerRef.current || e.target === orbitRef.current) {
      setExpandedItems({});
      setActiveNodeId(null);
      setPulseEffect({});
      setAutoRotate(true);
    }
  };

  const toggleItem = (id: number) => {
    setExpandedItems((prev) => {
      const newState = { ...prev };
      Object.keys(newState).forEach((key) => {
        if (parseInt(key) !== id) {
          newState[parseInt(key)] = false;
        }
      });

      newState[id] = !prev[id];

      if (!prev[id]) {
        setActiveNodeId(id);
        setAutoRotate(false);

        const relatedItems = getRelatedItems(id);
        const newPulseEffect: Record<number, boolean> = {};
        relatedItems.forEach((relId) => {
          newPulseEffect[relId] = true;
        });
        setPulseEffect(newPulseEffect);

        centerViewOnNode(id);
      } else {
        setActiveNodeId(null);
        setAutoRotate(true);
        setPulseEffect({});
      }

      return newState;
    });
  };

  useEffect(() => {
    let rotationTimer: NodeJS.Timeout;

    if (autoRotate && viewMode === "orbital") {
      rotationTimer = setInterval(() => {
        setRotationAngle((prev) => {
          const newAngle = (prev + 0.2) % 360;
          return Number(newAngle.toFixed(3));
        });
      }, 50);
    }

    return () => {
      if (rotationTimer) {
        clearInterval(rotationTimer);
      }
    };
  }, [autoRotate, viewMode]);

  const centerViewOnNode = (nodeId: number) => {
    if (viewMode !== "orbital" || !nodeRefs.current[nodeId]) return;

    const nodeIndex = timelineData.findIndex((item) => item.id === nodeId);
    const totalNodes = timelineData.length;
    const targetAngle = (nodeIndex / totalNodes) * 360;

    setRotationAngle(270 - targetAngle);
  };

  const calculateNodePosition = (index: number, total: number) => {
    const angle = ((index / total) * 360 + rotationAngle) % 360;
    const radius = 220;
    const radian = (angle * Math.PI) / 180;

    const x = radius * Math.cos(radian) + centerOffset.x;
    const y = radius * Math.sin(radian) + centerOffset.y;

    const zIndex = Math.round(100 + 50 * Math.cos(radian));
    const opacity = Math.max(
      0.5,
      Math.min(1, 0.5 + 0.5 * ((1 + Math.sin(radian)) / 2))
    );

    return { x, y, angle, zIndex, opacity };
  };

  const getRelatedItems = (itemId: number): number[] => {
    const currentItem = timelineData.find((item) => item.id === itemId);
    return currentItem ? currentItem.relatedIds : [];
  };

  const isRelatedToActive = (itemId: number): boolean => {
    if (!activeNodeId) return false;
    const relatedItems = getRelatedItems(activeNodeId);
    return relatedItems.includes(itemId);
  };

  const getStatusStyles = (status: TimelineItem["status"]): string => {
    switch (status) {
      case "completed":
        return "text-white bg-gradient-to-r from-cyan-500 to-blue-600 border-cyan-400";
      case "in-progress":
        return "text-black bg-gradient-to-r from-amber-400 to-amber-500 border-amber-300";
      case "pending":
        return "text-white bg-gradient-to-r from-purple-600/60 to-pink-600/60 border-purple-400/60";
      default:
        return "text-white bg-gradient-to-r from-purple-600/60 to-pink-600/60 border-purple-400/60";
    }
  };

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center overflow-hidden relative"
      ref={containerRef}
      onClick={handleContainerClick}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-cyan-500/5 to-purple-600/5"></div>
      
      <div className="relative w-full max-w-5xl h-full flex items-center justify-center">
        <div
          className="absolute w-full h-full flex items-center justify-center"
          ref={orbitRef}
          style={{
            perspective: "1000px",
            transform: `translate(${centerOffset.x}px, ${centerOffset.y}px)`,
          }}
        >
          <div className="absolute w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 animate-pulse flex items-center justify-center z-10 shadow-2xl shadow-cyan-500/50">
            <div className="absolute w-24 h-24 rounded-full border border-cyan-300/30 animate-ping opacity-70"></div>
            <div
              className="absolute w-28 h-28 rounded-full border border-blue-400/20 animate-ping opacity-40"
              style={{ animationDelay: "0.5s" }}
            ></div>
            <div className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center">
              <Brain size={20} className="text-blue-600" />
            </div>
          </div>

          <div className="absolute w-96 h-96 rounded-full border border-cyan-300/20"></div>
          <div className="absolute w-80 h-80 rounded-full border border-blue-400/10"></div>

          {timelineData.map((item, index) => {
            const position = calculateNodePosition(index, timelineData.length);
            const isExpanded = expandedItems[item.id];
            const isRelated = isRelatedToActive(item.id);
            const isPulsing = pulseEffect[item.id];
            const Icon = item.icon;

            const nodeStyle = {
              transform: `translate(${position.x}px, ${position.y}px)`,
              zIndex: isExpanded ? 200 : position.zIndex,
              opacity: isExpanded ? 1 : position.opacity,
            };

            return (
              <div
                key={item.id}
                ref={(el) => (nodeRefs.current[item.id] = el)}
                className="absolute transition-all duration-700 cursor-pointer group"
                style={nodeStyle}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleItem(item.id);
                }}
              >
                <div
                  className={`absolute rounded-full -inset-1 ${
                    isPulsing ? "animate-pulse duration-1000" : ""
                  }`}
                  style={{
                    background: `radial-gradient(circle, ${item.color}40 0%, ${item.color}20 50%, transparent 70%)`,
                    width: `${item.energy * 0.6 + 50}px`,
                    height: `${item.energy * 0.6 + 50}px`,
                    left: `-${(item.energy * 0.6 + 50 - 50) / 2}px`,
                    top: `-${(item.energy * 0.6 + 50 - 50) / 2}px`,
                  }}
                ></div>

                <div
                  className={`
                  w-12 h-12 rounded-full flex items-center justify-center
                  ${
                    isExpanded
                      ? `bg-gradient-to-br ${item.color} text-white shadow-lg`
                      : isRelated
                      ? `bg-gradient-to-br ${item.color} text-white animate-pulse`
                      : `bg-slate-800 text-cyan-300 border border-cyan-400/40 hover:border-cyan-300`
                  }
                  transition-all duration-300 transform group-hover:scale-110
                  ${isExpanded ? "scale-125 shadow-2xl shadow-cyan-500/50" : ""}
                `}
                  style={{
                    background: isExpanded || isRelated 
                      ? `linear-gradient(135deg, ${item.color}, ${item.color}dd)` 
                      : undefined
                  }}
                >
                  <Icon size={18} />
                </div>

                <div
                  className={`
                  absolute top-14 left-1/2 -translate-x-1/2 whitespace-nowrap
                  text-xs font-bold tracking-wider uppercase
                  transition-all duration-300
                  ${isExpanded 
                    ? "text-cyan-300 scale-110 drop-shadow-lg" 
                    : "text-cyan-200/80 group-hover:text-cyan-300"
                  }
                `}
                >
                  {item.title}
                </div>

                {isExpanded && (
                  <Card className="absolute top-20 left-1/2 -translate-x-1/2 w-80 bg-gradient-to-br from-slate-900/95 via-blue-900/30 to-slate-800/95 backdrop-blur-xl border border-cyan-300/30 shadow-2xl shadow-cyan-500/20 overflow-visible">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-px h-3 bg-gradient-to-t from-cyan-400/60 to-transparent"></div>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center">
                        <Badge
                          className={`px-3 py-1 text-xs font-bold ${getStatusStyles(
                            item.status
                          )}`}
                        >
                          {item.status === "completed"
                            ? "✓ MAÎTRISÉ"
                            : item.status === "in-progress"
                            ? "⚡ EN COURS"
                            : "⏳ À VENIR"}
                        </Badge>
                        <span className="text-xs font-mono text-cyan-300/70 tracking-wider">
                          {item.date}
                        </span>
                      </div>
                      <CardTitle className="text-lg mt-3 text-white font-bold tracking-wide">
                        {item.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-cyan-100/90">
                      <p className="leading-relaxed">{item.content}</p>

                      <div className="mt-5 pt-4 border-t border-cyan-300/20">
                        <div className="flex justify-between items-center text-xs mb-2">
                          <span className="flex items-center text-cyan-300">
                            <Zap size={12} className="mr-1" />
                            Niveau de Maîtrise
                          </span>
                          <span className="font-mono text-cyan-200">{item.energy}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-1000 ease-out"
                            style={{ width: `${item.energy}%` }}
                          ></div>
                        </div>
                      </div>

                      {item.relatedIds.length > 0 && (
                        <div className="mt-5 pt-4 border-t border-cyan-300/20">
                          <div className="flex items-center mb-3">
                            <Link size={12} className="text-cyan-400 mr-2" />
                            <h4 className="text-xs uppercase tracking-wider font-bold text-cyan-300">
                              Compétences Liées
                            </h4>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {item.relatedIds.map((relatedId) => {
                              const relatedItem = timelineData.find(
                                (i) => i.id === relatedId
                              );
                              return (
                                <Button
                                  key={relatedId}
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center h-7 px-3 py-0 text-xs rounded-full border border-cyan-400/30 bg-transparent hover:bg-cyan-400/10 text-cyan-200 hover:text-cyan-100 transition-all"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleItem(relatedId);
                                  }}
                                >
                                  {relatedItem?.title}
                                  <ArrowRight
                                    size={10}
                                    className="ml-1 text-cyan-400/80"
                                  />
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
    </div>
  );
}