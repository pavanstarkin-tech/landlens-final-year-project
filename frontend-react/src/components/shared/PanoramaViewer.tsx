import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, EyeOff } from 'lucide-react';
import { Viewer } from '@photo-sphere-viewer/core';
import '@photo-sphere-viewer/core/index.css';

interface PanoramaViewerProps {
  url?: string;
}

export const PanoramaViewer: React.FC<PanoramaViewerProps> = React.memo(({ url }) => {
  const [safeUrl, setSafeUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [extractedUrl, setExtractedUrl] = useState<string>('');
  const [isNativeImage, setIsNativeImage] = useState<boolean>(false);
  const [, setGyroEnabled] = useState<boolean>(false);
  
  const viewerRef = useRef<HTMLDivElement>(null);
  const viewerInstance = useRef<Viewer | null>(null);

  useEffect(() => {
    let currentUrl = url || '';
    if (currentUrl && typeof currentUrl === 'string' && currentUrl.trim().toLowerCase().startsWith('<iframe')) {
      const match = currentUrl.match(/src\s*=\s*["']([^"']+)["']/i);
      if (match && match[1]) {
        currentUrl = match[1];
      }
    }
    setExtractedUrl(currentUrl);
    setErrorMsg(null);
    setSafeUrl(null);
    setIsNativeImage(false);

    if (!currentUrl) return;

    try {
      const parsedUrl = new URL(currentUrl);
      const hostname = parsedUrl.hostname.toLowerCase();
      const pathname = parsedUrl.pathname.toLowerCase();

      // Native Image Check (Cloudinary or direct image extensions)
      if (hostname.includes('cloudinary.com') || pathname.endsWith('.jpg') || pathname.endsWith('.jpeg') || pathname.endsWith('.png') || pathname.endsWith('.webp')) {
        setIsNativeImage(true);
        setSafeUrl(currentUrl);
        return;
      }

      setSafeUrl(currentUrl);
    } catch (e) {
      setSafeUrl(currentUrl);
    }
  }, [url]);

  useEffect(() => {
    if (isNativeImage && safeUrl && viewerRef.current) {
      if (viewerInstance.current) {
        viewerInstance.current.destroy();
      }

      const instance = new Viewer({
        container: viewerRef.current,
        panorama: safeUrl,
        navbar: ['fullscreen'],
        autorotateDelay: 1000,
        autorotateSpeed: '1rpm',
        defaultZoomLvl: 50
      });

      viewerInstance.current = instance;

      // Handle Device Gyroscope / Motion tracking
      const handleDeviceOrientation = (e: DeviceOrientationEvent) => {
        if (!viewerInstance.current || e.gamma === null || e.beta === null) return;
        
        // Map phone tilt & rotation (gamma: roll, beta: pitch) to panorama longitude/latitude
        const lon = (e.gamma || 0) * (Math.PI / 180);
        const lat = Math.min(Math.max(((e.beta || 0) - 45) * (Math.PI / 180), -Math.PI / 2.2), Math.PI / 2.2);

        try {
          viewerInstance.current.rotate({
            longitude: lon,
            latitude: lat
          });
        } catch (err) {}
      };

      // Request Gyroscope permission if required by iOS Safari
      if (typeof (DeviceOrientationEvent as any)?.requestPermission === 'function') {
        (DeviceOrientationEvent as any).requestPermission()
          .then((response: string) => {
            if (response === 'granted') {
              window.addEventListener('deviceorientation', handleDeviceOrientation, true);
              setGyroEnabled(true);
            }
          })
          .catch(() => {});
      } else if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', handleDeviceOrientation, true);
        setGyroEnabled(true);
      }

      return () => {
        if (window.DeviceOrientationEvent) {
          window.removeEventListener('deviceorientation', handleDeviceOrientation, true);
        }
        if (viewerInstance.current) {
          viewerInstance.current.destroy();
          viewerInstance.current = null;
        }
      };
    }
  }, [isNativeImage, safeUrl]);

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden shadow-lg border border-slate-800 flex flex-col">
      {errorMsg ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-300">
          <AlertCircle className="w-12 h-12 text-rose-500 mb-4 animate-pulse" />
          <h4 className="text-lg font-semibold text-white mb-2">Virtual Tour Load Error</h4>
          <p className="text-sm text-slate-400 max-w-sm mb-6">{errorMsg}</p>
          {extractedUrl && (
            <a href={extractedUrl} target="_blank" rel="noreferrer" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm rounded-xl shadow-md transition-all">
              Open Tour in New Tab
            </a>
          )}
        </div>
      ) : safeUrl ? (
        isNativeImage ? (
          <div ref={viewerRef} className="absolute inset-0 w-full h-full z-10"></div>
        ) : (
          <div className="absolute inset-0 w-full h-full z-10 overflow-hidden">
            <iframe
              src={safeUrl}
              style={{ width: '100%', height: '100%', border: 'none', display: 'block', position: 'absolute', top: 0, left: 0 }}
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; magnetometer; picture-in-picture; xr-spatial-tracking; fullscreen">
            </iframe>
          </div>
        )
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
          <EyeOff className="w-16 h-16 text-slate-600 mb-4" />
          <h4 className="text-base font-semibold text-slate-200 mb-1">No Virtual Tour Uploaded</h4>
          <p className="text-xs text-slate-500 max-w-xs">360° panorama views are verified by AI for boundary overlaps and duplicate claims.</p>
        </div>
      )}
    </div>
  );
});
