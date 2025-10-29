'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { canAccessRound } from '@/lib/roundHeadAuth'; // Make sure this utility exists and works

// Define interfaces (Copied from admin version)
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

// Round-specific configuration (Copied from admin version)
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
  const [savedPairs, setSavedPairs] = useState<any[]>([]);
  const [roundLocked, setRoundLocked] = useState(true); // State remains to control UI elements
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false); // For saving round data
  const [message, setMessage] = useState({ text: '', type: 'info' }); // General messages
  const [quaffleMessage, setQuaffleMessage] = useState({ text: '', type: 'info' }); // Specific for quaffle awards
  const [activePotion, setActivePotion] = useState<string | null>(null);

  // Add Potion Form State (Copied from admin version)
  const [showAddPotionForm, setShowAddPotionForm] = useState(false);
  const [newPotionName, setNewPotionName] = useState('');
  const [newIngredients, setNewIngredients] = useState<Ingredient[]>([]);
  const [currentIngredientName, setCurrentIngredientName] = useState('');
  const [currentIngredientHint, setCurrentIngredientHint] = useState('');
  const [addingPotion, setAddingPotion] = useState(false); // For add potion saving state

  // Pair submission state (Copied from admin version)
  const [selectedTeam1, setSelectedTeam1] = useState<string>('');
  const [selectedTeam2, setSelectedTeam2] = useState<string>('');
  const [selectedPotionPair, setSelectedPotionPair] = useState<string>('');
  const [pairPoints, setPairPoints] = useState<number | ''>('');
  const [pairTime, setPairTime] = useState<number | ''>('');
  const [savingPair, setSavingPair] = useState(false);

  // --- Authentication Check (Remains the same) ---
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

  // --- Fetch Data (Remains the same as admin version) ---
  const fetchData = useCallback(async () => {
    let didFail = false;
    const token = localStorage.getItem('token');
    if (!token) return;

    const previousTeamState = new Map(teams.map(t => [t._id, { score: t.score, time: t.time, potionCreatedRound2: t.potionCreatedRound2 }]));
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Cache-Control': 'no-cache'
    };

    try {
      const [statusRes, allTeamsRes, potionsRes, savedPairsRes] = await Promise.all([
        fetch('/api/admin/round-status?round=round-2', { headers }),
        fetch('/api/admin/teams', { headers }), // Fetch teams participating in round 2
        fetch('/api/admin/potions', { headers }),
        fetch('/api/rounds/round-2', { headers }) // Fetch saved pair results
      ]);

      // Process Status
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setRoundLocked(statusData.isLocked); // Keep track of lock status from admin
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
            return {
              _id: dbTeam._id.toString(),
              name: dbTeam.name,
              house: dbTeam.house,
              score: previousState?.score ?? 0,
              time: previousState?.time ?? 0,
              totalPoints: dbTeam.totalPoints || 0,
              potionCreatedRound2: previousState?.potionCreatedRound2 !== undefined ? previousState.potionCreatedRound2 : (dbTeam.potionCreatedRound2?.toString() ?? null),
            };
          });
        mappedTeams.sort((a: TeamScore, b: TeamScore) => a.name.localeCompare(b.name));
        setTeams(mappedTeams);
      } else {
        console.error('Teams fetch failed:', allTeamsRes.statusText);
        didFail = true;
        setTeams([]);
      }

       // Process Potions
      if (potionsRes.ok) {
        const potionsData = await potionsRes.json();
        setPotions(Array.isArray(potionsData) ? potionsData : []);
      } else {
         console.error('Potions fetch failed. Status:', potionsRes.status, potionsRes.statusText);
         setPotions([]);
         setMessage(prev => ({ text: (prev.text + (potionsRes.status === 404 ? ' Potion API missing.' : ' Failed potions load.')).trim(), type: 'error'}));
      }

      // Process saved pairs
      if (savedPairsRes.ok) {
        const savedData = await savedPairsRes.json();
        setSavedPairs(savedData?.round?.results || []);
      } else {
        console.warn('Saved pairs fetch failed:', savedPairsRes.statusText);
        setSavedPairs([]);
      }

       if (didFail && (!allTeamsRes.ok || !statusRes.ok)) {
           throw new Error('Essential data fetch failed.');
       }

    } catch (err: any) {
      console.error("Fetch Data Error:", err);
       if (!message.text.includes('Potion API missing') && !message.text.includes('Failed potions load')) {
           setMessage({ text: `Failed data load: ${err.message}`, type: 'error' });
       }
    } finally {
      setLoading(false);
    }
  }, [teams, message.text]); // Include teams in dependency array if preserving local edits between polls is important

  // --- Initial Fetch & Polling with optimized fetching ---
  useEffect(() => {
    let isSubscribed = true;
    let timeoutId: NodeJS.Timeout;

    const loadData = async () => {
      if (!user) return;
      
      try {
        if (isSubscribed) setLoading(true);
        await fetchData();
      } finally {
        if (isSubscribed) setLoading(false);
      }

      // Set up the next poll if still subscribed
      if (isSubscribed) {
        timeoutId = setTimeout(loadData, 60000); // Poll every 60s instead of 30s
      }
    };

    // Initial load
    loadData();

    // Cleanup function
    return () => {
      isSubscribed = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user]); // Only depends on user, fetchData is stable

  // --- Handlers (All handlers copied from admin version, EXCEPT toggleRoundLock) ---

  const handleTeamDataChange = (teamId: string, field: 'score' | 'time' | 'potionCreatedRound2', value: string | number | null) => {
      if (roundLocked) return;
      let processedValue = value;
      if (field === 'score' || field === 'time') {
          processedValue = Number(value) >= 0 ? Number(value) : 0;
      }
      else if (field === 'potionCreatedRound2') {
          processedValue = value === "" ? null : value as string | null;
      }
      setTeams(prevTeams => prevTeams.map(team =>
          team._id === teamId ? { ...team, [field]: processedValue } : team
      ));
  };

  // SAVE function targets /api/admin/teams (Now used by Round Head as well)
  // **Important**: Ensure Round Heads have permission for POST /api/admin/teams or create a separate endpoint
  const saveRoundData = async () => {
    if (roundLocked) {
      setMessage({ text: 'Round is locked by Admin. Cannot save.', type: 'error' });
      setTimeout(() => setMessage({ text: '', type: 'info' }), 3000);
      return;
    }
    setSaving(true);
    setMessage({ text: 'Saving round data...', type: 'info' });
    try {
      const token = localStorage.getItem('token');
      const updatePayload = teams.map(team => ({
          _id: team._id,
          score: team.score, // API uses this for $inc: { totalPoints: score }
          potionCreatedRound2: team.potionCreatedRound2 // API uses this for $set
      }));

      if (updatePayload.length === 0) {
          setMessage({ text: 'No teams to update.', type: 'info'});
          setSaving(false);
          setTimeout(() => setMessage({ text: '', type: 'info' }), 3000);
          return;
      }

      // Using the same admin endpoint, assuming permissions allow
      const res = await fetch('/api/admin/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(updatePayload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to save team data.');
      }

      setMessage({ text: 'Round data saved successfully!', type: 'success' });
      await fetchData();

    } catch (err: any) {
      console.error("Save Error:", err);
      setMessage({ text: `Failed to save: ${err.message}`, type: 'error' });
    } finally {
      setSaving(false);
      setTimeout(() => { if (message.type === 'success' || message.type === 'info') setMessage({ text: '', type: 'info' })}, 4000);
    }
  };

  // Submit Pair Result (Using the same endpoint, assuming permissions allow)
  const handleSubmitPair = async () => {
    if (roundLocked) { setMessage({ text: 'Round is locked by Admin. Cannot submit pairs.', type: 'error' }); setTimeout(() => setMessage({ text: '', type: 'info' }), 3000); return; }
    if (!selectedTeam1 || !selectedTeam2 || !selectedPotionPair || pairPoints === '' || pairTime === '') {
      setMessage({ text: 'Please select both teams, a potion, and enter points & time.', type: 'error' });
      setTimeout(() => setMessage({ text: '', type: 'info' }), 4000);
      return;
    }
    if (selectedTeam1 === selectedTeam2) { setMessage({ text: 'Team 1 and Team 2 cannot be the same.', type: 'error' }); setTimeout(() => setMessage({ text: '', type: 'info' }), 3000); return; }

    setSavingPair(true); setMessage({ text: 'Saving pair result...', type: 'info' });
    try {
      const token = localStorage.getItem('token');
      const payload = { team1Id: selectedTeam1, team2Id: selectedTeam2, potionId: selectedPotionPair, points: Number(pairPoints), time: Number(pairTime) };
      const res = await fetch('/api/admin/round-2/submit-pair', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to save pair result');
      setMessage({ text: 'Pair result saved.', type: 'success' });
      setSelectedTeam1(''); setSelectedTeam2(''); setSelectedPotionPair(''); setPairPoints(''); setPairTime('');
      await fetchData();
    } catch (err: any) {
      console.error('Submit Pair Error:', err);
      setMessage({ text: `Failed to save pair: ${err.message}`, type: 'error' });
    } finally { setSavingPair(false); setTimeout(() => { if (message.type !== 'error') setMessage({ text: '', type: 'info' }) }, 4000); }
  };

  // Reset LOCAL entries (Remains the same)
  const resetRound = async () => {
    if (roundLocked) {
        setMessage({ text: 'Round is locked by Admin. Cannot reset entries.', type: 'error' });
        setTimeout(() => setMessage({ text: '', type: 'info' }), 3000);
        return;
    }
    if (!confirm('Are you sure you want to clear all local score, time, and potion selections? Click "Save Round Data" afterwards if you want to apply this reset permanently.')) return;

    setTeams(prevTeams => prevTeams.map(t => ({ ...t, score: 0, time: 0, potionCreatedRound2: null })));
    setMessage({ text: 'Local entries reset. Click "Save Round Data" to apply.', type: 'info' });
     setTimeout(() => setMessage({ text: '', type: 'info' }), 5000);
  };

  // Award Quaffle (Using the same endpoint, assuming permissions allow)
  const awardQuaffle = async (house: string) => {
      if (roundLocked) {
          setQuaffleMessage({ text: 'Round is locked by Admin. Cannot award.', type: 'error' });
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
          setTimeout(() => setQuaffleMessage({ text: '', type: 'info' }), 4000);
      }
  };

  // Toggle potion details (Remains the same)
  const togglePotion = (potionId: string) => {
      setActivePotion(prev => (prev === potionId ? null : potionId));
  };

  // Potion Add/Remove/Save Handlers (Copied from admin version)
  const handleAddIngredient = () => {
    if (currentIngredientName.trim() && currentIngredientHint.trim()) {
      setNewIngredients([...newIngredients, { name: currentIngredientName, hint: currentIngredientHint }]);
      setCurrentIngredientName(''); setCurrentIngredientHint('');
    } else {
        setMessage({ text: 'Ingredient name and hint required.', type: 'error'});
        setTimeout(() => setMessage({ text: '', type: 'info' }), 3000);
    }
  };

  const handleRemoveIngredient = (index: number) => {
    setNewIngredients(newIngredients.filter((_, i) => i !== index));
  };

  const handleSavePotion = async () => {
    if (roundLocked) { setMessage({ text: 'Round is locked by Admin. Cannot add potions.', type: 'error'}); setTimeout(() => setMessage({ text: '', type: 'info' }), 3000); return; }
    if (!newPotionName.trim() || newIngredients.length === 0) {
      setMessage({ text: 'Potion name and at least one ingredient required.', type: 'error' });
      setTimeout(() => setMessage({ text: '', type: 'info' }), 3000);
      return;
    }
    setAddingPotion(true);
    setMessage({ text: 'Adding new potion...', type: 'info'});
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/potions', { // Using admin endpoint, assume permissions
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: newPotionName, ingredients: newIngredients }),
      });
      const contentType = res.headers.get("content-type");
      if (!res.ok || !contentType || !contentType.includes("application/json")) {
           const textResponse = await res.text();
           console.error("Save Potion Response:", textResponse);
           throw new Error(`Failed: Status ${res.status}. API route missing or invalid response.`);
      }
      await res.json();
      setMessage({ text: 'Potion added successfully!', type: 'success' });
      setNewPotionName(''); setNewIngredients([]); setCurrentIngredientName(''); setCurrentIngredientHint('');
      setShowAddPotionForm(false);
      await fetchData();
    } catch (err: any) {
      console.error("Save Potion Error:", err);
      setMessage({ text: `Failed to add potion: ${err.message}`, type: 'error' });
    } finally {
      setAddingPotion(false);
      setTimeout(() => { setMessage({ text: '', type: 'info'}) }, 4000);
    }
  };

  const handleDeletePotion = async (potionId: string, potionName: string) => {
    if (roundLocked) { setMessage({ text: 'Round is locked by Admin. Cannot delete potions.', type: 'error'}); setTimeout(() => setMessage({ text: '', type: 'info' }), 3000); return; }
    if (!confirm(`Are you sure you want to permanently delete the potion "${potionName}"?`)) return;

    setMessage({ text: `Deleting potion "${potionName}"...`, type: 'info' });
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/potions', { // Using admin endpoint, assume permissions
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ potionId: potionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete potion');
      setMessage({ text: `Potion "${potionName}" deleted!`, type: 'success' });
      await fetchData();
    } catch (err: any) {
      console.error("Delete Potion Error:", err);
      setMessage({ text: `Failed to delete potion: ${err.message}`, type: 'error' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ text: '', type: 'info' }), 4000);
    }
  };

  // --- Calculate house scores (Remains the same as admin version) ---
  const houseScores = roundConfig.houses.map(house => ({
    name: house,
    total: teams
           .filter(t => t.house === house)
           .reduce((sum, t) => sum + (t.score || 0), 0),
  }));

  // --- Render Loading State (Remains the same) ---
  if (loading) {
     return ( <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-amber-400 text-2xl font-['Cinzel'] animate-pulse"> Loading Round 2 Data... 🧪 </div> );
  }

  // --- Render Main Page (Adjusted Header and removed Lock button) ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-amber-100 p-6 font-['Cinzel']">
      <div className="max-w-7xl mx-auto">
        {/* Header - Adjusted for Round Head */}
        <header className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 text-amber-400"> 🧪 Round 2: {roundConfig.title} (Round Head) </h1>
            <p className="text-lg text-amber-200 mb-4">Manage potion pairings and award quaffle.</p>
            {/* Read-Only Lock Status Display */}
            <div className={`inline-block px-4 py-2 rounded font-semibold ${
              roundLocked ? 'bg-red-900 border-red-500 border-2 text-white' : 'bg-green-900 border-green-500 border-2 text-white'
            }`}>
              {roundLocked ? '🔒 Locked by Admin - View Only' : '🔓 Unlocked - Ready for Input'}
            </div>
            {/* Removed Lock/Unlock Button */}
            {/* Removed Reset Local Entries Button - less critical for Round Head? Can add back if needed */}
        </header>

        {/* General Message Display (Remains the same) */}
        {message.text && ( <div className={`p-3 mb-6 rounded text-center text-sm font-semibold border ${ message.type === 'error' ? 'bg-red-900/30 border-red-700 text-red-300' : message.type === 'success' ? 'bg-green-900/30 border-green-700 text-green-300' : 'bg-blue-900/30 border-blue-700 text-blue-300' }`} > {message.text} </div> )}

         {/* Warning Message when Locked */}
         {roundLocked && (
            <div className="p-4 mb-6 rounded text-center bg-red-900/50 border border-red-700 text-red-300">
                The round is currently locked by the Admin. You cannot edit data, add/delete potions, or award Quaffles.
            </div>
         )}


        {/* Potions Section (Remains the same as admin version) */}
        <div className="bg-gray-800 rounded-2xl p-6 mb-8 shadow-lg border-2 border-emerald-900/40">
            <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl text-emerald-400 font-semibold">Potion Recipes & Hints</h2>
                 {/* Add/Delete Potion functionality might depend on permissions */}
                 <button onClick={() => setShowAddPotionForm(!showAddPotionForm)} className={`px-4 py-2 rounded text-sm font-semibold transition-colors shadow-md ${showAddPotionForm ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`} disabled={addingPotion || roundLocked} > {showAddPotionForm ? 'Cancel Adding' : '+ Add New Potion'} </button>
            </div>
             {showAddPotionForm && (
                 <div className="mb-8 p-4 border border-emerald-600 rounded-lg bg-gray-700/50 space-y-4">
                     <h3 className="text-lg font-semibold text-emerald-200 mb-3">Create New Potion</h3>
                     <div> <label htmlFor="potionName" className="block text-sm font-medium text-emerald-100 mb-1">Potion Name:</label> <input type="text" id="potionName" value={newPotionName} onChange={(e) => setNewPotionName(e.target.value)} className="w-full bg-gray-600 border border-emerald-500 rounded px-3 py-1.5 text-emerald-50 focus:outline-none focus:ring-1 focus:ring-emerald-400" placeholder="e.g., Polyjuice Potion" /> </div>
                     <div className="border-t border-emerald-700/30 pt-4"> <h4 className="text-md font-medium text-emerald-100 mb-2">Add Ingredients:</h4> <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end"> <input type="text" value={currentIngredientName} onChange={(e) => setCurrentIngredientName(e.target.value)} className="bg-gray-600 border border-emerald-500 rounded px-3 py-1.5 text-emerald-50 focus:outline-none focus:ring-1 focus:ring-emerald-400" placeholder="Ingredient Name" /> <input type="text" value={currentIngredientHint} onChange={(e) => setCurrentIngredientHint(e.target.value)} className="bg-gray-600 border border-emerald-500 rounded px-3 py-1.5 text-emerald-50 focus:outline-none focus:ring-1 focus:ring-emerald-400" placeholder="Hint" /> <button onClick={handleAddIngredient} type="button" className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-sm rounded transition-colors"> Add Ingredient </button> </div> </div>
                     {newIngredients.length > 0 && ( <div className="mt-4 border-t border-emerald-700/30 pt-3"> <h4 className="text-md font-medium text-emerald-100 mb-2">Current Ingredients:</h4> <ul className="space-y-1 list-disc list-inside pl-2 max-h-40 overflow-y-auto"> {newIngredients.map((ing, index) => ( <li key={index} className="text-sm text-emerald-200/90 flex justify-between items-center"> <span>{ing.name} <i className="text-xs opacity-70">({ing.hint})</i></span> <button onClick={() => handleRemoveIngredient(index)} className="text-red-400 hover:text-red-300 text-xs ml-2 font-sans">✕</button> </li> ))} </ul> </div> )}
                     <div className="text-right mt-4"> <button onClick={handleSavePotion} disabled={addingPotion || roundLocked} className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold rounded transition-colors disabled:opacity-50" > {addingPotion ? 'Saving...' : 'Save Potion Recipe'} </button> </div>
                 </div>
             )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                {potions.length > 0 ? potions.map(potion => (
                     <div key={potion._id} className="relative bg-gradient-to-br from-gray-700/50 to-gray-800/70 border border-emerald-700/30 rounded-lg shadow-md overflow-hidden flex flex-col">
                        <button
                            onClick={() => togglePotion(potion._id)}
                            className="w-full text-left p-4 focus:outline-none flex-grow"
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
                        <div className="p-2 bg-gray-800 border-t border-emerald-900/50 text-right">
                             <button
                                onClick={() => handleDeletePotion(potion._id, potion.name)}
                                disabled={roundLocked || saving || addingPotion || potion.numberOfTimesCreated > 0}
                                className="px-3 py-1 bg-red-800 hover:bg-red-700 text-white text-xs font-semibold rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                title={potion.numberOfTimesCreated > 0 ? "Cannot delete: Potion used by teams" : roundLocked ? "Round locked by Admin" : "Delete Potion"}
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

        {/* Pair Submission (Remains the same as admin version) */}
        <div className="bg-gray-800 rounded-2xl p-6 mb-8 shadow-xl border-2 border-amber-900/40">
             <h2 className="text-2xl text-amber-300 mb-4 font-semibold">Submit Pair Result (Teams working together)</h2>
             <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div className="flex flex-col">
                    <label className="text-sm text-amber-200 mb-1">Team 1</label>
                    <select value={selectedTeam1} onChange={(e) => setSelectedTeam1(e.target.value)} disabled={roundLocked || savingPair} className="bg-gray-700 border border-amber-900/50 rounded px-3 py-2 text-amber-100">
                        <option value="">-- Select Team 1 --</option>
                        {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                    </select>
                </div>
                <div className="flex flex-col">
                    <label className="text-sm text-amber-200 mb-1">Team 2</label>
                    <select value={selectedTeam2} onChange={(e) => setSelectedTeam2(e.target.value)} disabled={roundLocked || savingPair} className="bg-gray-700 border border-amber-900/50 rounded px-3 py-2 text-amber-100">
                        <option value="">-- Select Team 2 --</option>
                        {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                    </select>
                </div>
                <div className="flex flex-col">
                    <label className="text-sm text-amber-200 mb-1">Potion</label>
                    <select value={selectedPotionPair} onChange={(e) => setSelectedPotionPair(e.target.value)} disabled={roundLocked || savingPair} className="bg-gray-700 border border-emerald-700/50 rounded px-3 py-2 text-emerald-100">
                        <option value="">-- Select Potion --</option>
                        {potions.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                </div>
                <div className="flex flex-col">
                    <label className="text-sm text-amber-200 mb-1">Points (Each)</label>
                    <input type="number" value={pairPoints} onChange={(e) => setPairPoints(e.target.value === '' ? '' : Number(e.target.value))} disabled={roundLocked || savingPair} className="bg-gray-700 border border-amber-900/50 rounded px-3 py-2 text-amber-100" placeholder="e.g., 50" min="0" />
                </div>
                <div className="flex flex-col">
                    <label className="text-sm text-amber-200 mb-1">Time (Minutes)</label>
                    <input type="number" value={pairTime} onChange={(e) => setPairTime(e.target.value === '' ? '' : Number(e.target.value))} disabled={roundLocked || savingPair} className="bg-gray-700 border border-amber-900/50 rounded px-3 py-2 text-amber-100" placeholder="e.g., 45" min="0"/>
                </div>
             </div>
             <div className="text-center mt-6">
                <button onClick={handleSubmitPair} disabled={savingPair || roundLocked} className="bg-gradient-to-r from-blue-700 to-blue-900 text-blue-100 font-bold py-2 px-6 rounded-lg border border-blue-400/30 hover:from-blue-800 hover:to-blue-950 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">{savingPair ? 'Saving...' : '💾 Submit Pair Result'}</button>
             </div>
        </div>

        {/* Saved Pair Results Table (Remains the same as admin version) */}
        <div className="bg-gray-800 rounded-2xl p-4 md:p-6 mb-8 shadow-xl border-2 border-amber-900/40">
             <h2 className="text-2xl text-amber-300 mb-4 font-semibold">Saved Pair Results</h2>
             <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="border-b-2 border-amber-900/30 text-amber-400 text-sm uppercase">
                      <th className="p-2 text-left">Team 1</th>
                      <th className="p-2 text-left">Team 2</th>
                      <th className="p-2 text-left">Potion Created</th>
                      <th className="p-2 text-center">Points Awarded</th>
                      <th className="p-2 text-center">Time (Min)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const filled = (savedPairs || []).filter((pair: any) => {
                        const hasTeams = Array.isArray(pair.teams) && pair.teams.length >= 2 && pair.teams[0]?.name && pair.teams[1]?.name;
                        const hasPoints = pair.points !== undefined && pair.points !== null;
                        const hasTime = pair.time !== undefined && pair.time !== null;
                        return hasTeams && hasPoints && hasTime;
                      });
                      if (filled.length === 0) {
                        return <tr><td colSpan={5} className="text-center p-4 text-amber-200/70 italic">No pair results submitted yet.</td></tr>;
                      }
                      return filled.map((pair: any, index: number) => (
                        <tr key={pair._id || index} className="border-t border-amber-900/20 hover:bg-gray-700/50 transition-colors text-sm">
                          <td className="p-2 font-medium">{pair.teams?.[0]?.name} ({pair.teams?.[0]?.house || ''})</td>
                          <td className="p-2 font-medium">{pair.teams?.[1]?.name} ({pair.teams?.[1]?.house || ''})</td>
                          <td className="p-2 text-emerald-300">{pair.potionCreated?.name || pair.teams?.[0]?.potionCreatedName || pair.teams?.[1]?.potionCreatedName || ''}</td>
                          <td className="p-2 text-center text-amber-300 font-semibold">{pair.points}</td>
                          <td className="p-2 text-center">{pair.time}</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
        </div>

        {/* Award Quaffle Section (Remains the same as admin version) */}
        <div className="mb-8 p-6 bg-gray-800 rounded-2xl shadow-lg border-2 border-amber-900/30 text-center">
             <h2 className="text-xl font-['Cinzel'] text-amber-400 mb-3">Award Round 2 Quaffle</h2>
             {quaffleMessage.text && ( <div className={`mb-4 p-2 rounded text-center text-xs font-semibold border ${ quaffleMessage.type === 'error' ? 'bg-red-900/30 border-red-700 text-red-300' : quaffleMessage.type === 'success' ? 'bg-green-900/30 border-green-700 text-green-300' : 'bg-blue-900/30 border-blue-700 text-blue-300' }`} > {quaffleMessage.text} </div> )}
             <div className="flex justify-center gap-4 flex-wrap">
                 {roundConfig.houses.map(h => ( <button key={h} onClick={() => awardQuaffle(h)} disabled={roundLocked} className="px-4 py-2 bg-amber-700 rounded text-white font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow" > Award {h} </button> ))}
             </div>
             {roundLocked && <p className="text-red-400 text-xs mt-3 italic">(Round locked by Admin)</p>}
         </div>


        {/* Visualizations (Remains the same as admin version) */}
        {teams.length > 0 && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            <div className="bg-gray-800 rounded-2xl p-6 shadow-lg border-2 border-amber-900/30">
                <h2 className="text-xl font-['Cinzel'] text-amber-400 mb-4 text-center"> House Rankings (Overall Points) </h2> {/* Changed label */}
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={houseScores}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#78350f" strokeOpacity={0.3} />
                            <XAxis dataKey="name" stroke="#fcd34d" />
                            <YAxis stroke="#fcd34d" />
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #78350f', borderRadius: '4px', color: '#fcd34d'}}/>
                            <Legend />
                            <Bar dataKey="total" fill="#b45309" name="Overall Points" /> {/* Changed name */}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div className="bg-gray-800 rounded-2xl p-6 shadow-lg border-2 border-amber-900/30">
                <h2 className="text-xl font-['Cinzel'] text-amber-400 mb-4 text-center"> Team Rankings (Overall Points) </h2> {/* Changed label */}
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        {/* Changed data source to teams and dataKey to totalPoints */}
                        <BarChart data={teams.sort((a,b) => b.totalPoints - a.totalPoints)}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#78350f" strokeOpacity={0.3} />
                            <XAxis dataKey="name" interval={0} angle={-45} textAnchor="end" height={80} stroke="#fcd34d" />
                            <YAxis stroke="#fcd34d" />
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #78350f', borderRadius: '4px', color: '#fcd34d' }}/>
                            <Legend />
                            <Bar dataKey="totalPoints" fill="#d97706" name="Overall Points"/> {/* Changed key and name */}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
           </div>
        )}

      </div> {/* End max-w-7xl */}
    </div> // End main container
  );
}