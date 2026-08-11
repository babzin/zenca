import React from 'react';

export default function AlertCard({ alert, onClick }) {
  const getCategoryColor = (category) => {
    const colors = {
      kidnapping: 'border-red-500',
      banditry: 'border-orange-500',
      terrorism: 'border-purple-500',
      accident: 'border-blue-500',
      other: 'border-gray-400',
    };
    return colors[category] || 'border-gray-400';
  };

  const getCategoryLabel = (category) => {
    const labels = {
      kidnapping: 'Kidnapping',
      banditry: 'Banditry',
      terrorism: 'Terrorism',
      accident: 'Accident',
      other: 'Other',
    };
    return labels[category] || category;
  };

  return (
    <div
      onClick={onClick}
      className={`p-3 mb-2 border-l-4 ${getCategoryColor(alert.category)} bg-gray-50 dark:bg-gray-700 rounded-r-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition`}
    >
      <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
        {alert.text || 'Emergency alert'}
      </p>
      <div className="flex justify-between items-center mt-1">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {getCategoryLabel(alert.category)}
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {new Date(alert.created_at).toLocaleTimeString()}
        </span>
      </div>
      {alert.distance && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {Math.round(alert.distance)}m away
        </p>
      )}
    </div>
  );
}