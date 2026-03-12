"use client";

import React from "react";

interface Config {
  theme: "light" | "dark" | "system";
  animate: boolean;
  snap: boolean;
  start: number;
  end: number;
  scroll: boolean;
  debug: boolean;
}

interface ScrollAnimationConfigProps {
  config: Config;
  onConfigChange: (config: Config) => void;
}

const ScrollAnimationConfig: React.FC<ScrollAnimationConfigProps> = ({
  config,
  onConfigChange,
}) => {
  const handleChange = (key: keyof Config, value: any) => {
    onConfigChange({ ...config, [key]: value });
  };

  return (
    <div className="fixed top-4 right-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-lg z-50 min-w-[200px]">
      <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-white">
        Config
      </h3>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs text-gray-600 dark:text-gray-400">
            Theme
          </label>
          <select
            value={config.theme}
            onChange={(e) => handleChange("theme", e.target.value)}
            className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-xs text-gray-600 dark:text-gray-400">
            Animate
          </label>
          <input
            type="checkbox"
            checked={config.animate}
            onChange={(e) => handleChange("animate", e.target.checked)}
            className="w-4 h-4"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-xs text-gray-600 dark:text-gray-400">
            Snap
          </label>
          <input
            type="checkbox"
            checked={config.snap}
            onChange={(e) => handleChange("snap", e.target.checked)}
            className="w-4 h-4"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-xs text-gray-600 dark:text-gray-400">
            Scrollbar
          </label>
          <input
            type="checkbox"
            checked={config.scroll}
            onChange={(e) => handleChange("scroll", e.target.checked)}
            className="w-4 h-4"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-xs text-gray-600 dark:text-gray-400">
            Debug
          </label>
          <input
            type="checkbox"
            checked={config.debug}
            onChange={(e) => handleChange("debug", e.target.checked)}
            className="w-4 h-4"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-600 dark:text-gray-400">
              Hue Start
            </label>
            <input
              type="number"
              value={config.start}
              onChange={(e) => handleChange("start", parseInt(e.target.value))}
              min={0}
              max={1000}
              className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white w-16"
            />
          </div>
          <input
            type="range"
            value={config.start}
            onChange={(e) => handleChange("start", parseInt(e.target.value))}
            min={0}
            max={1000}
            className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-600 dark:text-gray-400">
              Hue End
            </label>
            <input
              type="number"
              value={config.end}
              onChange={(e) => handleChange("end", parseInt(e.target.value))}
              min={0}
              max={1000}
              className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white w-16"
            />
          </div>
          <input
            type="range"
            value={config.end}
            onChange={(e) => handleChange("end", parseInt(e.target.value))}
            min={0}
            max={1000}
            className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};

export default ScrollAnimationConfig;
