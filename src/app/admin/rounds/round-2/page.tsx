'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { canAccessRound } from '@/lib/roundHeadAuth'; // Make sure this utility exists and works

// Define interfaces
interface TeamScore {
  _id: string; // MongoDB ObjectId as string
  name: string;
  house: string;
  score: number; // Local state for points to ADD this round
  time: number;  // Local state for time this round (NOTE: Not saved in Team model currently)
  totalPoints: number; // Fetched total points for display
  potionCreatedRound2: string | null; // ObjectId as string or null
}
interface Ingredient { name: string; hint: string; }
interface Potion { _id: string; name: string; numberOfTimesCreated: number; ingredients: Ingredient[]; }
interface RoundConfig { title: string; houses: string[]; scoringLabels: { score: string; time: string; }; }

// Round-specific configuration
const roundConfig: RoundConfig = {
  title: 'Potion Brewing',
  houses: ['Gryffindor', 'Hufflepuff', 'Ravenclaw'],
  scoringLabels: {
    score: 'Accuracy',
    time: 'Time (minutes)', // Label exists, but field isn't saved to Team model
  },
};

export default function Round2() {
  const [user, setUser] = useState<any>(null);
  const [teams, setTeams] = useState<TeamScore[]>([]);
  const [potions, setPotions] = useState<Potion[]>([]);
  const [roundLocked, setRoundLocked] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false); // For saving round data
  const [message, setMessage] = useState({ text: '', type: 'info' }); // General messages
  const [quaffleMessage, setQuaffleMessage] = useState({ text: '', type: 'info' }); // Specific for quaffle awards
  const [activePotion, setActivePotion] = useState<string | null>(null);

  // Add Potion Form State
  const [showAddPotionForm, setShowAddPotionForm] = useState(false);
  const [newPotionName, setNewPotionName] = useState('');
  const [newIngredients, setNewIngredients] = useState<Ingredient[]>([]);
  const [currentIngredientName, setCurrentIngredientName] = useState('');
  const [currentIngredientHint, setCurrentIngredientHint] = useState('');
  const [addingPotion, setAddingPotion] = useState(false); // For add potion saving state

  // --- Authentication Check ---
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/auth/login'; // Redirect if no token
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // Ensure canAccessRound function is correctly implemented and imported
      if (!canAccessRound(payload, 2)) {
        console.warn('User cannot access Round 2. Redirecting.');
        window.location.href = '/auth/login'; // Redirect if not authorized for this round
        return;
      }
      setUser(payload); // Set user state if authorized
    } catch (e) {
      console.error('Authentication Error:', e);
      localStorage.removeItem('token'); // Clear invalid token
      window.location.href = '/auth/login'; // Redirect on error
    }
  }, []); // Run only once on mount

  // --- Fetch Data ---
  const fetchData = useCallback(async () => {
    // Keep local message unless it's specifically cleared after an action
    // setMessage({ text: '', type: 'info' });
    let didFail = false;
    // Store previous local input state before refetching base data
    const previousTeamState = new Map(teams.map(t => [t._id, { score: t.score, time: t.time, potionCreatedRound2: t.potionCreatedRound2 }]));

    try {
      const [statusRes, allTeamsRes, potionsRes] = await Promise.all([
        fetch('/api/admin/round-status?round=round-2'),
        fetch('/api/admin/teams?round=2'), // Fetch teams participating in round 2
        fetch('/api/admin/potions')
      ]);

      // Process Status
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setRoundLocked(statusData.isLocked);
      } else {
        console.error('Status fetch failed:', statusRes.statusText);
        didFail = true;
      }

      // Process Teams
      if (allTeamsRes.ok) {
        const allTeamsData = await allTeamsRes.json();
        const mappedTeams = allTeamsData
          .filter((t: any) => t.isActive !== false) // Ensure active
          .map((dbTeam: any): TeamScore => {
            const previousState = previousTeamState.get(dbTeam._id.toString());
            // Prioritize previous local input state if it exists, otherwise use DB data or default
            return {
              _id: dbTeam._id.toString(),
              name: dbTeam.name,
              house: dbTeam.house,
              score: previousState?.score ?? 0, // Keep local score if editing, else 0
              time: previousState?.time ?? 0, // Keep local time if editing, else 0
              totalPoints: dbTeam.totalPoints || 0, // Get total points from DB for display
              // Use previous local selection if exists, else DB value, else null
              potionCreatedRound2: previousState?.potionCreatedRound2 !== undefined ? previousState.potionCreatedRound2 : (dbTeam.potionCreatedRound2?.toString() ?? null),
            };
          });
        // FIX: Add types here for sort parameters
        mappedTeams.sort((a: TeamScore, b: TeamScore) => a.name.localeCompare(b.name));
        setTeams(mappedTeams);
      } else {
        console.error('Teams fetch failed:', allTeamsRes.statusText);
        didFail = true;
        setTeams([]); // Clear teams if fetch failed
      }

       // Process Potions
      if (potionsRes.ok) {
        const potionsData = await potionsRes.json();
        setPotions(Array.isArray(potionsData) ? potionsData : []);
      } else {
         console.error('Potions fetch failed. Status:', potionsRes.status, potionsRes.statusText);
         setPotions([]);
         // Set general message, avoid overwriting critical errors if possible
         setMessage(prev => ({ text: (prev.text + (potionsRes.status === 404 ? ' Potion API missing.' : ' Failed potions load.')).trim(), type: 'error'}));
      }

       // Throw error only if essential fetches failed
       if (didFail && (!allTeamsRes.ok || !statusRes.ok)) {
           throw new Error('Essential data fetch failed.');
       }

    } catch (err: any) {
      console.error("Fetch Data Error:", err);
       // Avoid overwriting specific potion API error message
       if (!message.text.includes('Potion API missing') && !message.text.includes('Failed potions load')) {
           setMessage({ text: `Failed data load: ${err.message}`, type: 'error' });
       }
    } finally {
      setLoading(false); // Ensure loading is set to false
    }
  // Removed `teams` dependency to fetch fresh state. Add back if preserving edits between polls is critical.
  }, []);

  // --- Initial Fetch & Polling ---
   useEffect(() => {
    // Only fetch data once user is authenticated and set
    if (user) {
        setLoading(true); // Set loading true before initial fetch
        fetchData();
        const intervalId = setInterval(fetchData, 30000); // Poll every 30s
        return () => clearInterval(intervalId); // Cleanup interval
    }
  }, [user, fetchData]); // Depend on user and fetchData

  // --- Handlers ---
  const handleTeamDataChange = (teamId: string, field: 'score' | 'time' | 'potionCreatedRound2', value: string | number | null) => {
      if (roundLocked) return; // Prevent changes if round is locked
      let processedValue = value;
      // Ensure score/time are non-negative numbers
      if (field === 'score' || field === 'time') {
          processedValue = Number(value) >= 0 ? Number(value) : 0;
      }
      // Handle empty string from select as null for potion ID
      else if (field === 'potionCreatedRound2') {
          processedValue = value === "" ? null : value as string | null;
      }
      // Update the specific team's state
      setTeams(prevTeams => prevTeams.map(team =>
          team._id === teamId ? { ...team, [field]: processedValue } : team
      ));
  };

  // SAVE function targets /api/admin/teams
  const saveRoundData = async () => {
    if (roundLocked) {
      setMessage({ text: 'Round is locked. Cannot save.', type: 'error' });
      setTimeout(() => setMessage({ text: '', type: 'info' }), 3000);
      return;
    }
    setSaving(true);
    setMessage({ text: 'Saving round data...', type: 'info' }); // User feedback: saving started
    try {
      const token = localStorage.getItem('token');
      // Prepare payload: Send only necessary fields for update
      const updatePayload = teams.map(team => ({
          _id: team._id,
          score: team.score, // API uses this for $inc: { totalPoints: score }
          potionCreatedRound2: team.potionCreatedRound2 // API uses this for $set
          // Time is NOT included as it's not in the Team schema
      }));

      if (updatePayload.length === 0) {
          setMessage({ text: 'No teams to update.', type: 'info'});
          setSaving(false);
          setTimeout(() => setMessage({ text: '', type: 'info' }), 3000);
          return;
      }

      const res = await fetch('/api/admin/teams', { // Target the TEAMS API endpoint
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(updatePayload), // Send the array of updates
      });

      const data = await res.json();
      if (!res.ok || !data.success) { // Check both status and success flag from API
          throw new Error(data.error || 'Failed to save team data.');
      }

      setMessage({ text: 'Round data saved successfully!', type: 'success' }); // Confirmation message
      // Re-fetch data AFTER successful save to show updated totals and reset local scores/time
      await fetchData();

    } catch (err: any) {
      console.error("Save Error:", err);
      setMessage({ text: `Failed to save: ${err.message}`, type: 'error' }); // Show error message
    } finally {
      setSaving(false); // End saving state
      // Clear message after 4 seconds ONLY if it wasn't an error
      setTimeout(() => { if (message.type === 'success' || message.type === 'info') setMessage({ text: '', type: 'info' })}, 4000);
    }
  };

  // Toggle round lock status
  const toggleRoundLock = async () => {
    setMessage({ text: 'Updating lock status...', type: 'info' }); // Use general message state
    try {
      const res = await fetch('/api/admin/round-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ round: 'round-2', isLocked: !roundLocked }),
      });
      if (!res.ok) throw new Error('Failed to update lock status');
      const data = await res.json();
      setRoundLocked(data.isLocked);
      setMessage({ text: `Round ${data.isLocked ? 'locked' : 'unlocked'} successfully.`, type: 'success' }); // Use general message state
    } catch (err: any) {
      console.error(err);
      setMessage({ text: `Error updating lock status: ${err.message}`, type: 'error' }); // Use general message state
    } finally {
        setTimeout(() => setMessage({ text: '', type: 'info' }), 3000); // Clear general message
    }
  };

  // Reset LOCAL score/time/potion entries
  const resetRound = async () => {
    if (roundLocked) {
        setMessage({ text: 'Unlock the round to reset entries.', type: 'error' });
        setTimeout(() => setMessage({ text: '', type: 'info' }), 3000);
        return;
    }
    if (!confirm('Are you sure you want to clear all local score, time, and potion selections in the table? You will need to click "Save Round Data" to make the reset permanent.')) return;

    // Reset local state ONLY
    setTeams(prevTeams => prevTeams.map(t => ({ ...t, score: 0, time: 0, potionCreatedRound2: null })));
    setMessage({ text: 'Local entries reset. Click "Save Round Data" to apply changes.', type: 'info' });
     setTimeout(() => setMessage({ text: '', type: 'info' }), 5000); // Keep message longer
  };

  // Award Quaffle handler using specific state
  const awardQuaffle = async (house: string) => {
      if (roundLocked) {
          setQuaffleMessage({ text: 'Unlock round to award.', type: 'error' }); // Use quaffle message state
          setTimeout(() => setQuaffleMessage({ text: '', type: 'info' }), 3000);
          return;
      }
      setQuaffleMessage({ text: `Awarding quaffle to ${house}...`, type: 'info'});
      try {
          const token = localStorage.getItem('token');
          const res = await fetch('/api/admin/award-quaffle', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
              body: JSON.stringify({ house: house, round: 'round-2' }),
          });
          if (!res.ok) throw new Error('API request failed');
          setQuaffleMessage({ text: `Quaffle awarded to ${house}!`, type: 'success' });
      } catch (e) {
          console.error(e);
          setQuaffleMessage({ text: 'Failed to award quaffle.', type: 'error' });
      } finally {
          // Clear quaffle message after 4 seconds
          setTimeout(() => setQuaffleMessage({ text: '', type: 'info' }), 4000);
      }
  };

  // Toggle potion details visibility
  const togglePotion = (potionId: string) => {
      setActivePotion(prev => (prev === potionId ? null : potionId));
  };

  // Add ingredient to the new potion form's list
  const handleAddIngredient = () => {
    if (currentIngredientName.trim() && currentIngredientHint.trim()) {
      setNewIngredients([...newIngredients, { name: currentIngredientName, hint: currentIngredientHint }]);
      setCurrentIngredientName(''); setCurrentIngredientHint(''); // Clear inputs
    } else {
        setMessage({ text: 'Ingredient name and hint required.', type: 'error'}); // Use general message
        setTimeout(() => setMessage({ text: '', type: 'info' }), 3000);
    }
  };

  // Remove ingredient from the new potion form's list
  const handleRemoveIngredient = (index: number) => {
    setNewIngredients(newIngredients.filter((_, i) => i !== index));
  };

  // Save the new potion via API
  const handleSavePotion = async () => {
    if (!newPotionName.trim() || newIngredients.length === 0) {
      setMessage({ text: 'Potion name and at least one ingredient required.', type: 'error' });
      setTimeout(() => setMessage({ text: '', type: 'info' }), 3000);
      return;
    }
    setAddingPotion(true); // Indicate saving potion
    setMessage({ text: 'Adding new potion...', type: 'info'});
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/potions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: newPotionName, ingredients: newIngredients }),
      });
      // Check response before parsing JSON
      const contentType = res.headers.get("content-type");
      if (!res.ok || !contentType || !contentType.includes("application/json")) {
           const textResponse = await res.text();
           console.error("Save Potion Response:", textResponse);
           throw new Error(`Failed: Status ${res.status}. API route missing or invalid response.`);
      }
      await res.json(); // Parse JSON response
      setMessage({ text: 'Potion added successfully!', type: 'success' });
      // Reset form state
      setNewPotionName(''); setNewIngredients([]); setCurrentIngredientName(''); setCurrentIngredientHint('');
      setShowAddPotionForm(false); // Hide form
      await fetchData(); // Refresh data to show the new potion in lists
    } catch (err: any) {
      console.error("Save Potion Error:", err);
      setMessage({ text: `Failed to add potion: ${err.message}`, type: 'error' });
    } finally {
      setAddingPotion(false); // End saving potion state
      // Clear general message after 4 seconds
      setTimeout(() => { setMessage({ text: '', type: 'info'}) }, 4000);
    }
  };
  
  // --- Delete Potion Handler ---
  const handleDeletePotion = async (potionId: string, potionName: string) => {
    if (roundLocked) {
        setMessage({ text: 'Unlock the round to delete potions.', type: 'error'});
        setTimeout(() => setMessage({ text: '', type: 'info' }), 3000);
        return;
    }
    // Confirmation dialog
    if (!confirm(`Are you sure you want to permanently delete the potion "${potionName}"? This cannot be undone.`)) {
      return;
    }

    setMessage({ text: `Deleting potion "${potionName}"...`, type: 'info' });
    setSaving(true); // Use general saving state to disable buttons

    try {
      const token = localStorage.getItem('token'); // Include if auth needed
      const res = await fetch('/api/admin/potions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Include if auth needed
        },
        body: JSON.stringify({ potionId: potionId }), // Send ID in body
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete potion');
      }

      setMessage({ text: `Potion "${potionName}" deleted successfully!`, type: 'success' });
      // Refresh potion list
      await fetchData(); // Refetch all data

    } catch (err: any) {
      console.error("Delete Potion Error:", err);
      setMessage({ text: `Failed to delete potion: ${err.message}`, type: 'error' });
    } finally {
      setSaving(false); // Release saving state
      // Clear message after a delay
      setTimeout(() => setMessage({ text: '', type: 'info' }), 4000);
    }
  };

  // --- Calculate house scores based on ROUND score input ---
  const houseScores = roundConfig.houses.map(house => ({
    name: house,
    total: teams
           .filter(t => t.house === house)
           .reduce((sum, t) => sum + (t.score || 0), 0), // Use local round score (t.score)
  }));


  // --- Render Loading State ---
  if (loading) {
     return ( <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-amber-400 text-2xl font-['Cinzel'] animate-pulse"> Loading Round 2 Data... 🧪 </div> );
  }

  // --- Render Main Page ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-amber-100 p-6 font-['Cinzel']">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 text-amber-400"> 🧪 Round 2: {roundConfig.title} </h1>
            <p className="text-lg text-amber-200 mb-4">Admin Panel - Update accuracy, time (local), and assign potions.</p>
            <div className="flex justify-center gap-4 flex-wrap">
              <button onClick={toggleRoundLock} className={`px-4 py-2 rounded font-semibold transition-colors ${ roundLocked ? 'bg-green-700 hover:bg-green-600 border border-green-500' : 'bg-red-700 hover:bg-red-600 border border-red-500' } text-white shadow-md`} > {roundLocked ? '🔓 Unlock Round' : '🔒 Lock Round'} </button>
              {!roundLocked && ( <button onClick={resetRound} className="px-4 py-2 rounded bg-yellow-700 hover:bg-yellow-600 border border-yellow-500 text-white font-semibold shadow-md transition-colors" disabled={saving || addingPotion} > ↺ Reset Local Entries </button> )}
            </div>
        </header>

        {/* General Message Display (For Save, Reset, Lock, Fetch Errors) */}
        {message.text && ( <div className={`p-3 mb-6 rounded text-center text-sm font-semibold border ${ message.type === 'error' ? 'bg-red-900/30 border-red-700 text-red-300' : message.type === 'success' ? 'bg-green-900/30 border-green-700 text-green-300' : 'bg-blue-900/30 border-blue-700 text-blue-300' }`} > {message.text} </div> )}

        {/* Potions Section */}
        <div className="bg-gray-800 rounded-2xl p-6 mb-8 shadow-lg border-2 border-emerald-900/40">
            <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl text-emerald-400 font-semibold">Potion Recipes & Hints</h2>
                 <button onClick={() => setShowAddPotionForm(!showAddPotionForm)} className={`px-4 py-2 rounded text-sm font-semibold transition-colors shadow-md ${showAddPotionForm ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`} disabled={addingPotion || roundLocked} > {showAddPotionForm ? 'Cancel Adding' : '+ Add New Potion'} </button>
            </div>
             {showAddPotionForm && (
                 <div className="mb-8 p-4 border border-emerald-600 rounded-lg bg-gray-700/50 space-y-4">
                     <h3 className="text-lg font-semibold text-emerald-200 mb-3">Create New Potion</h3>
                     <div> <label htmlFor="potionName" className="block text-sm font-medium text-emerald-100 mb-1">Potion Name:</label> <input type="text" id="potionName" value={newPotionName} onChange={(e) => setNewPotionName(e.target.value)} className="w-full bg-gray-600 border border-emerald-500 rounded px-3 py-1.5 text-emerald-50 focus:outline-none focus:ring-1 focus:ring-emerald-400" placeholder="e.g., Polyjuice Potion" /> </div>
                     <div className="border-t border-emerald-700/30 pt-4"> <h4 className="text-md font-medium text-emerald-100 mb-2">Add Ingredients:</h4> <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end"> <input type="text" value={currentIngredientName} onChange={(e) => setCurrentIngredientName(e.target.value)} className="bg-gray-600 border border-emerald-500 rounded px-3 py-1.5 text-emerald-50 focus:outline-none focus:ring-1 focus:ring-emerald-400" placeholder="Ingredient Name" /> <input type="text" value={currentIngredientHint} onChange={(e) => setCurrentIngredientHint(e.target.value)} className="bg-gray-600 border border-emerald-500 rounded px-3 py-1.5 text-emerald-50 focus:outline-none focus:ring-1 focus:ring-emerald-400" placeholder="Hint" /> <button onClick={handleAddIngredient} type="button" className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-sm rounded transition-colors"> Add Ingredient </button> </div> </div>
                     {newIngredients.length > 0 && ( <div className="mt-4 border-t border-emerald-700/30 pt-3"> <h4 className="text-md font-medium text-emerald-100 mb-2">Current Ingredients:</h4> <ul className="space-y-1 list-disc list-inside pl-2 max-h-40 overflow-y-auto"> {newIngredients.map((ing, index) => ( <li key={index} className="text-sm text-emerald-200/90 flex justify-between items-center"> <span>{ing.name} <i className="text-xs opacity-70">({ing.hint})</i></span> <button onClick={() => handleRemoveIngredient(index)} className="text-red-400 hover:text-red-300 text-xs ml-2 font-sans">✕</button> </li> ))} </ul> </div> )}
                     <div className="text-right mt-4"> <button onClick={handleSavePotion} disabled={addingPotion} className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold rounded transition-colors disabled:opacity-50" > {addingPotion ? 'Saving...' : 'Save Potion Recipe'} </button> </div>
                 </div>
             )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                {potions.length > 0 ? potions.map(potion => (
                     <div key={potion._id} className="relative bg-gradient-to-br from-gray-700/50 to-gray-800/70 border border-emerald-700/30 rounded-lg shadow-md overflow-hidden flex flex-col"> {/* Added flex flex-col */}
                        <button
                            onClick={() => togglePotion(potion._id)}
                            className="w-full text-left p-4 focus:outline-none flex-grow" // Added flex-grow
                        >
                            <h3 className="text-lg font-semibold text-emerald-300">{potion.name}</h3>
                             <p className="text-xs text-emerald-100/70 mt-1">Times Created: {potion.numberOfTimesCreated}</p>
                             <span className="absolute top-3 right-3 text-emerald-400 transition-transform duration-300"> {activePotion === potion._id ? '▲' : '▼'} </span>
                        </button>
                        {activePotion === potion._id && (
                             <div className="px-4 pb-4 pt-2 border-t border-emerald-700/20 bg-black/30 backdrop-blur-sm">
                                <h4 className="text-md font-semibold text-emerald-200 mb-2">Ingredients:</h4>
                                <ul className="space-y-3">
                                    {potion.ingredients.map((ing, index) => (
                                        <li key={index} className="text-sm">
                                            <strong className="text-emerald-100">{ing.name}:</strong>
                                            <p className="text-emerald-200/80 italic text-xs ml-2">{ing.hint}</p>
                                        </li>
                                    ))}
                                </ul>
                             </div>
                        )}
                        {/* Delete Button - Placed below the details */}
                        <div className="p-2 bg-gray-800 border-t border-emerald-900/50 text-right">
                             <button
                                onClick={() => handleDeletePotion(potion._id, potion.name)}
                                disabled={roundLocked || saving || addingPotion || potion.numberOfTimesCreated > 0} // Disable if locked, saving, or in use
                                className="px-3 py-1 bg-red-800 hover:bg-red-700 text-white text-xs font-semibold rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                title={potion.numberOfTimesCreated > 0 ? "Cannot delete: Potion has been created by teams" : "Delete Potion"} // Add title for disabled state
                             >
                                Delete
                             </button>
                        </div>
                     </div>
                )) : (
                    <p className="text-center text-emerald-200/70 italic md:col-span-3">{message.text.includes('Potion API missing') ? 'Potion API route missing.' : 'No potions found. Add one above.'}</p>
                )}
            </div>
        </div>

        {/* Team Scoring Table */}
        <div className="bg-gray-800 rounded-2xl p-4 md:p-6 mb-8 shadow-xl border-2 border-amber-900/40">
             <h2 className="text-2xl text-amber-300 mb-4 font-semibold">Update Team Performance</h2>
             <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className="border-b-2 border-amber-900/30 text-amber-400 text-sm uppercase">
                      <th className="p-2 text-left">Team Name</th>
                      <th className="p-2 text-left">House</th>
                      <th className="p-2 text-center">Total Points</th>
                      <th className="p-2 text-center">{roundConfig.scoringLabels.score} (+/-)</th>
                      <th className="p-2 text-center">{roundConfig.scoringLabels.time}</th>
                      <th className="p-2 text-center">Potion Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teams.map((team) => (
                      <tr key={team._id} className="border-t border-amber-900/20 hover:bg-gray-700/40 transition-colors text-sm">
                        <td className="p-2 font-medium">{team.name}</td>
                        <td className="p-2">{team.house}</td>
                        <td className="p-2 text-center text-amber-300 font-semibold">{team.totalPoints}</td>
                        <td className="p-2 text-center"> <input type="number" value={team.score} onChange={(e) => handleTeamDataChange(team._id, 'score', e.target.value)} disabled={roundLocked} className={`w-20 bg-gray-700 border ${roundLocked ? 'border-gray-600' : 'border-amber-900/50'} rounded px-2 py-1 text-amber-100 text-center focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-60 disabled:cursor-not-allowed`} placeholder="0" /> </td>
                        <td className="p-2 text-center"> <input type="number" min="0" value={team.time} onChange={(e) => handleTeamDataChange(team._id, 'time', e.target.value)} disabled={roundLocked} className={`w-20 bg-gray-700 border ${roundLocked ? 'border-gray-600' : 'border-amber-900/50'} rounded px-2 py-1 text-amber-100 text-center focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-60 disabled:cursor-not-allowed`} placeholder="0" /> </td>
                        <td className="p-2 text-center"> <select value={team.potionCreatedRound2 ?? ""} onChange={(e) => handleTeamDataChange(team._id, 'potionCreatedRound2', e.target.value)} disabled={roundLocked} className={`w-48 bg-gray-700 border ${roundLocked ? 'border-gray-600' : 'border-emerald-700/50'} rounded px-2 py-1 text-emerald-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed`} > <option value="">-- None --</option> {potions.map(p => ( <option key={p._id} value={p._id}> {p.name} </option> ))} </select> </td>
                      </tr>
                    ))}
                     {teams.length === 0 && !loading && ( <tr><td colSpan={6} className="text-center p-4 text-amber-200/70 italic">No active teams found for Round 2.</td></tr> )}
                  </tbody>
                </table>
              </div>
              {/* Save Button */}
              {!roundLocked && ( <div className="text-center mt-6"> <button onClick={saveRoundData} disabled={saving || roundLocked || addingPotion} className="bg-gradient-to-r from-blue-700 to-blue-900 text-blue-100 font-bold py-2 px-6 rounded-lg border border-blue-400/30 hover:from-blue-800 hover:to-blue-950 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed" > {saving ? 'Saving...' : '💾 Save Round Data'} </button> </div> )}
        </div>

        {/* Award Quaffle Section */}
        <div className="mb-8 p-6 bg-gray-800 rounded-2xl shadow-lg border-2 border-amber-900/30 text-center">
             <h2 className="text-xl font-['Cinzel'] text-amber-400 mb-3">Award Round 2 Quaffle</h2>
             {/* Quaffle Message Display - Moved Here */}
             {quaffleMessage.text && ( <div className={`mb-4 p-2 rounded text-center text-xs font-semibold border ${ quaffleMessage.type === 'error' ? 'bg-red-900/30 border-red-700 text-red-300' : quaffleMessage.type === 'success' ? 'bg-green-900/30 border-green-700 text-green-300' : 'bg-blue-900/30 border-blue-700 text-blue-300' }`} > {quaffleMessage.text} </div> )}
             <div className="flex justify-center gap-4 flex-wrap">
                 {roundConfig.houses.map(h => ( <button key={h} onClick={() => awardQuaffle(h)} disabled={roundLocked} className="px-4 py-2 bg-amber-700 rounded text-white font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow" > Award {h} </button> ))}
             </div>
             {roundLocked && <p className="text-red-400 text-xs mt-3 italic">(Unlock round to award)</p>}
         </div>


        {/* Visualizations */}
        {teams.length > 0 && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            {/* House-wise scores chart */}
            <div className="bg-gray-800 rounded-2xl p-6 shadow-lg border-2 border-amber-900/30">
                <h2 className="text-xl font-['Cinzel'] text-amber-400 mb-4 text-center"> House Rankings (This Round) </h2>
                <div className="h-[300px]">
                    {/* FIX: Ensure ResponsiveContainer has only one direct child */}
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={houseScores}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#78350f" strokeOpacity={0.3} />
                            <XAxis dataKey="name" stroke="#fcd34d" />
                            <YAxis stroke="#fcd34d" />
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #78350f', borderRadius: '4px', color: '#fcd34d'}}/>
                            <Legend />
                            <Bar dataKey="total" fill="#b45309" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
            {/* Team Rankings chart */}
            <div className="bg-gray-800 rounded-2xl p-6 shadow-lg border-2 border-amber-900/30">
                <h2 className="text-xl font-['Cinzel'] text-amber-400 mb-4 text-center"> Team Rankings (This Round) </h2>
                <div className="h-[300px]">
                     {/* FIX: Ensure ResponsiveContainer has only one direct child */}
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={teams}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#78350f" strokeOpacity={0.3} />
                            <XAxis dataKey="name" interval={0} angle={-45} textAnchor="end" height={80} stroke="#fcd34d" />
                            <YAxis stroke="#fcd34d" />
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #78350f', borderRadius: '4px', color: '#fcd34d' }}/>
                            <Legend />
                            <Bar dataKey="score" fill="#d97706" name={roundConfig.scoringLabels.score}/>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
           </div>
        )}

      </div> {/* End max-w-7xl */}
    </div> // End main container
  );
} // End Component