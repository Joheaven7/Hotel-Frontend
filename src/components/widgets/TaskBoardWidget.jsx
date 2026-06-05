import React from 'react';
import StatusBadge from '../ui/StatusBadge';
import { Clock } from 'lucide-react';

const priorityConfig = {
  high: 'text-error bg-error/10',
  medium: 'text-warning bg-warning/10',
  low: 'text-success bg-success/10',
};

const TaskBoardWidget = ({ tasks }) => {
  return (
    <div className="bg-surface rounded-card shadow-soft overflow-hidden h-full flex flex-col">
      <div className="p-6 border-b border-border">
        <h3 className="text-lg font-heading font-bold text-text-primary">Today's Tasks</h3>
      </div>
      <div className="p-4 flex-1 overflow-y-auto space-y-3">
        {tasks?.map(task => (
          <div key={task.id} className="p-4 border border-border rounded-xl hover:border-primary/30 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${priorityConfig[task.priority]}`}>
                  {task.priority}
                </span>
                <span className="text-sm font-medium text-text-primary capitalize">
                  {task.type.replace('-', ' ')}
                </span>
              </div>
              <StatusBadge type={task.status} />
            </div>
            <div className="flex items-center justify-between mt-4">
              <p className="text-text-primary font-bold">Room {task.room}</p>
              <div className="flex items-center text-text-secondary text-sm">
                <Clock size={14} className="mr-1" />
                {task.time}
              </div>
            </div>
          </div>
        ))}
        {(!tasks || tasks.length === 0) && (
          <p className="text-text-secondary text-center py-4">No tasks assigned.</p>
        )}
      </div>
    </div>
  );
};

export default TaskBoardWidget;
