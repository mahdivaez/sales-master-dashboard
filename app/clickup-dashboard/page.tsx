"use client"
import { useEffect, useState, useMemo } from 'react';
import { 
  Search, 
  Users, 
  CheckSquare, 
  Clock, 
  AlertCircle, 
  ChevronRight, 
  ExternalLink, 
  Mail, 
  Calendar,
  Filter,
  RefreshCw,
  ArrowLeft,
  LayoutGrid,
  List as ListIcon,
  Activity,
  Layers
} from 'lucide-react';

interface UserTaskData {
  email: string;
  username: string;
  userId: string;
  teamName: string;
  teamId: string;
  spaceName: string;
  spaceId: string;
  listName: string;
  listId: string;
  taskName: string;
  taskId: string;
  taskStatus: string;
  taskStatusColor: string;
  priority: string;
  dateCreated: string;
  dateUpdated: string;
  dueDate: string;
  creatorEmail: string;
  creatorName: string;
  customFields: Record<string, any>;
}

interface GroupedData {
  email: string;
  username: string;
  tasks: UserTaskData[];
}

export default function ClickupUserDashboard() {
  const [allUserTasks, setAllUserTasks] = useState<UserTaskData[]>([]);
  const [groupedData, setGroupedData] = useState<GroupedData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<GroupedData | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTasks: 0,
    totalTeams: 0
  });

  const API_KEY = 'pk_100611057_ILFUO8IA7C3KWBZB94JAKJZ5OPPVTHCY';

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    const allData: UserTaskData[] = [];

    try {
      const teamsRes = await fetch('https://api.clickup.com/api/v2/team', {
        headers: { 'Authorization': API_KEY }
      });
      const teamsData = await teamsRes.json();
      const teams = teamsData.teams || [];

      for (const team of teams) {
        const spacesRes = await fetch(
          `https://api.clickup.com/api/v2/team/${team.id}/space?archived=false`,
          { headers: { 'Authorization': API_KEY } }
        );
        const spacesData = await spacesRes.json();
        const spaces = spacesData.spaces || [];

        for (const space of spaces) {
          const listsRes = await fetch(
            `https://api.clickup.com/api/v2/space/${space.id}/list?archived=false`,
            { headers: { 'Authorization': API_KEY } }
          );
          const listsData = await listsRes.json();
          const lists = listsData.lists || [];

          for (const list of lists) {
            const tasksRes = await fetch(
              `https://api.clickup.com/api/v2/list/${list.id}/task?archived=false&limit=100`,
              { headers: { 'Authorization': API_KEY } }
            );
            const tasksData = await tasksRes.json();
            const tasks = tasksData.tasks || [];

            for (const task of tasks) {
              if (task.assignees && task.assignees.length > 0) {
                for (const assignee of task.assignees) {
                  const customFieldsObj: Record<string, any> = {};
                  if (task.custom_fields) {
                    task.custom_fields.forEach((field: any) => {
                      customFieldsObj[field.name] = field.value || 'N/A';
                    });
                  }

                  allData.push({
                    email: assignee.email || 'No Email',
                    username: assignee.username || 'Unknown',
                    userId: assignee.id || '',
                    teamName: team.name,
                    teamId: team.id,
                    spaceName: space.name,
                    spaceId: space.id,
                    listName: list.name,
                    listId: list.id,
                    taskName: task.name,
                    taskId: task.id,
                    taskStatus: task.status?.status || 'Unknown',
                    taskStatusColor: task.status?.color || '#gray',
                    priority: task.priority?.priority || 'None',
                    dateCreated: task.date_created ? new Date(parseInt(task.date_created)).toLocaleDateString('en-US') : 'Unknown',
                    dateUpdated: task.date_updated ? new Date(parseInt(task.date_updated)).toLocaleDateString('en-US') : 'Unknown',
                    dueDate: task.due_date ? new Date(parseInt(task.due_date)).toLocaleDateString('en-US') : 'None',
                    creatorEmail: task.creator?.email || 'Unknown',
                    creatorName: task.creator?.username || 'Unknown',
                    customFields: customFieldsObj
                  });
                }
              }
            }
          }
        }
      }

      setAllUserTasks(allData);

      const grouped = allData.reduce((acc, item) => {
        const key = item.email;
        if (!acc[key]) {
          acc[key] = {
            email: item.email,
            username: item.username,
            tasks: []
          };
        }
        acc[key].tasks.push(item);
        return acc;
      }, {} as Record<string, GroupedData>);

      const groupedArray = Object.values(grouped);
      setGroupedData(groupedArray);

      const uniqueUsers = new Set(allData.map(d => d.email)).size;
      const uniqueTeams = new Set(allData.map(d => d.teamId)).size;
      setStats({
        totalUsers: uniqueUsers,
        totalTasks: allData.length,
        totalTeams: uniqueTeams
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const filteredData = useMemo(() => {
    return groupedData.filter(group =>
      group.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, groupedData]);

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'high': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'normal': return 'bg-sky-50 text-sky-600 border-sky-100';
      case 'low': return 'bg-slate-50 text-slate-500 border-slate-100';
      default: return 'bg-slate-50 text-slate-400 border-slate-50';
    }
  };

  if (selectedUser) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-10 font-sans text-slate-900">
        <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          <button 
            onClick={() => setSelectedUser(null)}
            className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-8 transition-all group font-medium"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Overview
          </button>

          <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden mb-8">
            <div className="p-8 md:p-12 border-b border-slate-50 bg-gradient-to-br from-indigo-50/30 via-white to-white">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-indigo-200/50 ring-4 ring-indigo-50">
                    {selectedUser.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-1">{selectedUser.username}</h1>
                    <div className="flex flex-wrap gap-4">
                      <p className="text-slate-500 flex items-center gap-2 text-sm font-medium">
                        <Mail className="w-4 h-4 text-indigo-400" />
                        {selectedUser.email}
                      </p>
                      <p className="text-slate-500 flex items-center gap-2 text-sm font-medium">
                        <Activity className="w-4 h-4 text-emerald-400" />
                        {selectedUser.tasks.length} Active Tasks
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-0 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">Task Details</th>
                    <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">Status</th>
                    <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">Priority</th>
                    <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">Location</th>
                    <th className="px-8 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">Due Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {selectedUser.tasks.map((task, idx) => (
                    <tr key={task.taskId} className="hover:bg-indigo-50/30 transition-colors group/row">
                      <td className="px-8 py-6">
                        <div className="font-bold text-slate-800 group-hover/row:text-indigo-700 transition-colors">{task.taskName}</div>
                        <div className="text-[11px] font-medium text-slate-400 mt-1 tracking-wider">ID: {task.taskId}</div>
                      </td>
                      <td className="px-8 py-6">
                        <span 
                          className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border"
                          style={{ 
                            backgroundColor: `${task.taskStatusColor}10`, 
                            color: task.taskStatusColor,
                            borderColor: `${task.taskStatusColor}20`
                          }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full mr-2" style={{ backgroundColor: task.taskStatusColor }}></span>
                          {task.taskStatus}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <Layers className="w-3.5 h-3.5 text-slate-300" />
                          {task.spaceName}
                        </div>
                        <div className="text-xs font-medium text-slate-400 mt-0.5 ml-5">{task.listName}</div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                          <Calendar className="w-4 h-4 text-slate-300" />
                          {task.dueDate}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-10 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
          <div className="animate-in fade-in slide-in-from-left-4 duration-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <LayoutGrid className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-indigo-600 uppercase tracking-[0.2em]">Workspace Analytics</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
              ClickUp <span className="text-indigo-600">Dashboard</span>
            </h1>
            <p className="text-slate-500 mt-3 text-lg font-medium">Monitor team productivity and task distribution in real-time.</p>
          </div>
          
          <div className="flex items-center gap-4 animate-in fade-in slide-in-from-right-4 duration-700">
            <button
              onClick={fetchAllData}
              disabled={loading}
              className="inline-flex items-center justify-center gap-3 px-6 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-[0_4px_20px_rgb(0,0,0,0.03)] disabled:opacity-50 group"
            >
              <RefreshCw className={`w-4 h-4 transition-transform group-hover:rotate-180 duration-500 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Syncing Workspace...' : 'Refresh Data'}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          <div className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border-2 border-slate-100 flex items-center gap-6 group hover:border-indigo-100 transition-all">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Users</p>
              <p className="text-3xl font-black text-slate-900">{stats.totalUsers}</p>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border-2 border-slate-100 flex items-center gap-6 group hover:border-emerald-100 transition-all">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
              <CheckSquare className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Active Tasks</p>
              <p className="text-3xl font-black text-slate-900">{stats.totalTasks}</p>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border-2 border-slate-100 flex items-center gap-6 group hover:border-violet-100 transition-all">
            <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center text-violet-600 group-hover:scale-110 transition-transform">
              <Clock className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Teams</p>
              <p className="text-3xl font-black text-slate-900">{stats.totalTeams}</p>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white p-5 rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 mb-10 flex flex-col md:flex-row gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name or email address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all outline-none text-slate-900 font-medium placeholder:text-slate-300"
            />
          </div>
          <div className="flex items-center gap-3 px-6 py-4 bg-indigo-50/50 border border-indigo-100/50 rounded-2xl text-indigo-600 text-sm font-bold">
            <Filter className="w-4 h-4" />
            <span>{filteredData.length} Members Found</span>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-rose-50 border border-rose-100 rounded-[1.5rem] p-6 flex items-start gap-4 mb-10 animate-in zoom-in duration-300">
            <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600 flex-shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-rose-900 text-lg">Connection Error</p>
              <p className="text-rose-600 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        {loading ? (
          <div className="bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 p-24 text-center">
            <div className="relative w-20 h-20 mx-auto mb-8">
              <div className="absolute inset-0 border-4 border-indigo-50 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Syncing with ClickUp</h3>
            <p className="text-slate-400 font-medium max-w-xs mx-auto text-lg">We're gathering the latest task data from your workspace...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            {filteredData.map((user) => (
              <div 
                key={user.email}
                onClick={() => setSelectedUser(user)}
                className="group bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border-2 border-slate-100 p-8 hover:border-indigo-400 hover:shadow-[0_20px_40px_rgb(79,70,229,0.08)] transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
                
                <div className="flex items-center gap-5 mb-8">
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 font-black text-xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 group-hover:shadow-lg group-hover:shadow-indigo-200">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-slate-900 truncate group-hover:text-indigo-600 transition-colors text-lg">
                      {user.username}
                    </h3>
                    <p className="text-sm font-medium text-slate-400 truncate">{user.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-50 group-hover:bg-white group-hover:border-indigo-50 transition-colors">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tasks</p>
                    <p className="text-xl font-black text-slate-900">{user.tasks.length}</p>
                  </div>
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-50 group-hover:bg-white group-hover:border-indigo-50 transition-colors">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: user.tasks[0]?.taskStatusColor || '#cbd5e1' }}></div>
                      <p className="text-[11px] font-bold text-slate-700 truncate uppercase tracking-tighter">
                        {user.tasks[0]?.taskStatus || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-600 flex items-center gap-2 group-hover:gap-3 transition-all">
                    View Full Report <ExternalLink className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}

            {filteredData.length === 0 && !loading && (
              <div className="col-span-full bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 p-20 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Search className="w-10 h-10 text-slate-200" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">No results found</h3>
                <p className="text-slate-400 font-medium text-lg">We couldn't find any members matching your search.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
