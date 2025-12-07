    /***************
     * Habit Tracker Single-file
     * Features:
     * - Add habits (localStorage)
     * - Toggle done (instant update)
     * - Progress bar updates live
     * - Daily reset of 'done' state when date changes
     * - Clear completed / Reset all
     ***************/

    const KEY = "habitTracker.v1";
    const listEl = document.getElementById("habit-list");
    const inputEl = document.getElementById("habit-input");
    const addBtn = document.getElementById("add-btn");
    const progressFill = document.getElementById("progress-fill");
    const progressText = document.getElementById("progress-text");
    const dateDisplay = document.getElementById("date-display");
    const clearDoneBtn = document.getElementById("clear-done");
    const resetAllBtn = document.getElementById("reset-all");

    // state
    let state = {
      habits: [],
      lastDate: todayString()
    };

    // util: today's YYYY-MM-DD
    function todayString(){
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth()+1).padStart(2,"0");
      const dd = String(d.getDate()).padStart(2,"0");
      return `${y}-${m}-${dd}`;
    }

    function load(){
      try{
        const raw = localStorage.getItem(KEY);
        if(!raw) return;
        const parsed = JSON.parse(raw);
        if(parsed && Array.isArray(parsed.habits)){
          state.habits = parsed.habits;
          state.lastDate = parsed.lastDate || todayString();
        }
      }catch(e){
        console.warn("Could not parse local data:", e);
      }
    }

    function save(){
      state.lastDate = todayString();
      localStorage.setItem(KEY, JSON.stringify(state));
    }

    function resetIfNewDay(){
      const now = todayString();
      if(state.lastDate !== now){
        // clear done flags for new day
        state.habits = state.habits.map(h => ({...h, done: false}));
        state.lastDate = now;
        save();
      }
    }

    function render(){
      // display date
      dateDisplay.textContent = new Date().toLocaleDateString();

      listEl.innerHTML = "";
      state.habits.forEach((h, idx) => {
        const li = document.createElement("li");
        li.className = "habit";
        li.innerHTML = `
          <div class="left">
            <label style="display:flex;align-items:center;gap:10px">
              <span class="checkbox ${h.done ? 'checked' : ''}" data-idx="${idx}" aria-hidden="true">
                ${h.done ? '✓' : ''}
              </span>
              <div>
                <div class="habit-name ${h.done ? 'done' : ''}">${escapeHtml(h.name)}</div>
                <div class="small muted" style="margin-top:4px">Added ${h.addedAt || ''}</div>
              </div>
            </label>
          </div>
          <div class="controls">
            <button class="btn icon" data-action="toggle" data-idx="${idx}" title="Toggle done">●</button>
            <button class="btn icon" data-action="delete" data-idx="${idx}" title="Delete">✕</button>
          </div>
        `;
        listEl.appendChild(li);
      });

      updateProgress();
    }

    function updateProgress(){
      const total = state.habits.length;
      const done = state.habits.filter(h => h.done).length;
      const percent = total ? Math.round((done/total)*100) : 0;
      progressFill.style.width = percent + "%";
      progressFill.textContent = percent + "%";
      progressText.textContent = `${done} / ${total}`;
    }

    function addHabit(){
      const raw = inputEl.value.trim();
      if(!raw) return;
      const habit = {
        name: raw,
        done: false,
        addedAt: new Date().toLocaleString()
      };
      state.habits.push(habit);
      inputEl.value = "";
      save();
      render();
      // focus back
      inputEl.focus();
    }

    function toggleDone(index){
      if(state.habits[index]){
        state.habits[index].done = !state.habits[index].done;
        save();
        // small pop animation on checkbox
        const checkbox = document.querySelector('.checkbox[data-idx="'+index+'"]');
        if(checkbox){
          checkbox.classList.toggle('checked', state.habits[index].done);
          checkbox.classList.add('pop');
          setTimeout(()=>checkbox.classList.remove('pop'), 180);
        }
        render();
      }
    }

    function deleteHabit(index){
      if(!state.habits[index]) return;
      state.habits.splice(index,1);
      save();
      render();
    }

    function clearCompleted(){
      state.habits = state.habits.filter(h => !h.done);
      save();
      render();
    }

    function resetAll(){
      if(!confirm("Reset all habits and progress? This cannot be undone.")) return;
      state.habits = [];
      save();
      render();
    }

    // handle clicks on dynamic list (event delegation)
    listEl.addEventListener("click", (ev) => {
      const tgt = ev.target;
      const action = tgt.getAttribute && tgt.getAttribute("data-action");
      const idx = tgt.getAttribute && tgt.getAttribute("data-idx");
      if(action === "toggle"){
        toggleDone(Number(idx));
        return;
      }
      if(action === "delete"){
        deleteHabit(Number(idx));
        return;
      }
      // clicking the custom checkbox span
      if(tgt.classList && tgt.classList.contains("checkbox")){
        const i = Number(tgt.getAttribute("data-idx"));
        toggleDone(i);
      }
    });

    // buttons
    addBtn.addEventListener("click", addHabit);
    inputEl.addEventListener("keydown", (e) => {
      if(e.key === "Enter") addHabit();
    });
    clearDoneBtn.addEventListener("click", clearCompleted);
    resetAllBtn.addEventListener("click", resetAll);

    // small escape util
    function escapeHtml(s){
      return s.replace(/[&<>"']/g, function(m){
        return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m];
      });
    }

    // init
    (function init(){
      load();
      resetIfNewDay();
      render();

      // every minute check if day rolled over (in case tab left open overnight)
      setInterval(()=>{
        const now = todayString();
        if(now !== state.lastDate){
          resetIfNewDay();
          render();
        }
      }, 60_000);
    })();

    // Expose for debugging in console (optional)
    window._HT = {
      state, save, load, render, addHabit, toggleDone, deleteHabit, clearCompleted, resetAll
    };
