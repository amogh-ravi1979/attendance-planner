
import { useEffect, useState } from "react";
import "./App.css";

const API_BASE = "http://localhost:5000/api";

function App() {
  const [total, setTotal] = useState(60);
  const [attended, setAttended] = useState(48);
  const [target, setTarget] = useState(75);
  const [subject, setSubject] = useState("Overall Attendance");

  const [futureAttend, setFutureAttend] = useState(5);
  const [futureMiss, setFutureMiss] = useState(3);

  const [activeTab, setActiveTab] = useState("dashboard");
  const [records, setRecords] = useState([]);
  const [apiMessage, setApiMessage] = useState("Connecting to backend...");
  const [isSaving, setIsSaving] = useState(false);

  // Fetch saved records when the application starts
  useEffect(() => {
    let cancelled = false;

    async function fetchRecords() {
      try {
        const response = await fetch(`${API_BASE}/attendance`);
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Unable to fetch records");
        }

        if (cancelled) return;

        const savedRecords = Array.isArray(result.data)
          ? result.data
          : [];

        setRecords(savedRecords);

        // Load the latest saved record
        if (savedRecords.length > 0) {
          const latest = savedRecords[savedRecords.length - 1];

          setSubject(latest.subject || "General");
          setTotal(Number(latest.totalClasses));
          setAttended(Number(latest.attendedClasses));
          setTarget(Number(latest.targetAttendance));
        }

        setApiMessage(
          `Backend connected. ${savedRecords.length} saved record(s) found.`
        );
      } catch (error) {
        if (!cancelled) {
          setApiMessage(`Backend connection failed: ${error.message}`);
        }
      }
    }

    fetchRecords();

    return () => {
      cancelled = true;
    };
  }, []);

  // Save attendance record
  async function saveAttendance() {
    if (
      !Number.isInteger(total) ||
      total <= 0 ||
      !Number.isInteger(attended) ||
      attended < 0 ||
      attended > total ||
      !Number.isFinite(target) ||
      target < 1 ||
      target > 100
    ) {
      setApiMessage("Please enter valid attendance details.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`${API_BASE}/attendance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: subject.trim() || "General",
          totalClasses: total,
          attendedClasses: attended,
          targetAttendance: target,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to save attendance");
      }

      setRecords((previous) => [...previous, result.data]);
      setApiMessage("Attendance record saved successfully!");
    } catch (error) {
      setApiMessage(`Save failed: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  }

  // Load an existing record
  function loadRecord(record) {
    setSubject(record.subject || "General");
    setTotal(Number(record.totalClasses));
    setAttended(Number(record.attendedClasses));
    setTarget(Number(record.targetAttendance));

    setApiMessage(`Loaded ${record.subject || "attendance"} record.`);
  }

  // Delete a saved record
  async function deleteRecord(id) {
    try {
      const response = await fetch(`${API_BASE}/attendance/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to delete record");
      }

      setRecords((previous) =>
        previous.filter((record) => record.id !== id)
      );

      setApiMessage("Attendance record deleted.");
    } catch (error) {
      setApiMessage(`Delete failed: ${error.message}`);
    }
  }

  const current = total > 0 ? (attended / total) * 100 : 0;

  const projectedTotal = total + futureAttend + futureMiss;
  const projectedAttended = attended + futureAttend;

  const projected =
    projectedTotal > 0
      ? (projectedAttended / projectedTotal) * 100
      : 0;

  const targetDecimal = target / 100;

  const canMiss =
    total > 0
      ? Math.max(
          0,
          Math.floor(
            (attended - targetDecimal * total) /
              targetDecimal +
              0.0000001
          )
        )
      : 0;

  const futureSafeMisses = Math.max(
    0,
    Math.floor(
      (projectedAttended - targetDecimal * projectedTotal) /
        targetDecimal +
        0.0000001
    )
  );

  const status = current >= target ? "On Track" : "Below Target";

  function resetScenario() {
    setFutureAttend(0);
    setFutureMiss(0);
  }

  function navigateTo(tab) {
    setActiveTab(tab);

    const element = document.getElementById(
      tab === "dashboard" ? "dashboard" : "scenario"
    );

    element?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">A</div>
          <div>
            <h2>Attendly</h2>
            <span>ATTENDANCE PLANNER</span>
          </div>
        </div>

        <div className="side-label">MENU</div>

        <div
          className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => navigateTo("dashboard")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter") navigateTo("dashboard");
          }}
        >
          ▦ &nbsp; Dashboard
        </div>

        <div
          className={`nav-item ${activeTab === "scenario" ? "active" : ""}`}
          onClick={() => navigateTo("scenario")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter") navigateTo("scenario");
          }}
        >
          ◷ &nbsp; Scenario Planner
        </div>

        <div className="sidebar-bottom">
          <div className="avatar">S</div>
          <div>
            <strong>Student Workspace</strong>
            <span>Personal Dashboard</span>
          </div>
        </div>
      </aside>

      <main className="main" id="dashboard">
        <header className="topbar">
          <div>
            <span className="breadcrumb">Workspace / Dashboard</span>
            <h1>Attendance Dashboard</h1>
            <p>Know where you stand. Plan where you go.</p>
          </div>
          <div className="date-pill">✦ &nbsp; Attendance Insights</div>
        </header>

        <section className="welcome">
          <div>
            <span className="eyebrow">YOUR ACADEMIC OVERVIEW</span>
            <h2>Stay ahead of your attendance.</h2>
            <p>
              Track your classes and make smarter decisions about
              your upcoming attendance.
            </p>
          </div>
          <div className="welcome-icon">▤</div>
        </section>

        <section className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">CURRENT ATTENDANCE</span>
            <h2>{current.toFixed(1)}%</h2>
            <span className="stat-note">Your current attendance rate</span>
            <div className="progress">
              <div
                className="progress-fill green"
                style={{ width: `${Math.min(current, 100)}%` }}
              />
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-label">CLASSES ATTENDED</span>
            <h2>{attended}</h2>
            <span className="stat-note">Out of {total} total classes</span>
          </div>

          <div className="stat-card">
            <span className="stat-label">TARGET ATTENDANCE</span>
            <h2>{target}%</h2>
            <span className="stat-note">Your minimum desired rate</span>
          </div>

          <div className="stat-card">
            <span className="stat-label">SAFE ABSENCES</span>
            <h2>{canMiss}</h2>
            <span className="stat-note">Additional classes you can miss</span>
          </div>
        </section>

        <section className="content-grid">
          <div className="panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">01 / YOUR RECORD</span>
                <h2>Attendance Details</h2>
                <p>Update your current academic records.</p>
              </div>
              <span className="panel-icon">✎</span>
            </div>

            <div className="field">
              <label>Subject / Record Name</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Mathematics"
              />
            </div>

            <div className="field">
              <label>Total classes conducted</label>
              <input
                type="number"
                min="1"
                step="1"
                value={total}
                onChange={(e) => {
                  const value = Math.max(0, Number(e.target.value));
                  setTotal(value);
                  setAttended((prev) => Math.min(prev, value));
                }}
              />
            </div>

            <div className="field">
              <label>Classes attended</label>
              <input
                type="number"
                min="0"
                max={total}
                step="1"
                value={attended}
                onChange={(e) =>
                  setAttended(
                    Math.min(total, Math.max(0, Number(e.target.value)))
                  )
                }
              />
            </div>

            <div className="field">
              <label>Target attendance (%)</label>
              <input
                type="number"
                min="1"
                max="100"
                step="any"
                value={target}
                onChange={(e) =>
                  setTarget(
                    Math.min(100, Math.max(1, Number(e.target.value)))
                  )
                }
              />
            </div>

            <button
              className="reset-button"
              onClick={saveAttendance}
              disabled={isSaving}
              style={{ width: "100%", marginTop: "8px" }}
            >
              {isSaving ? "Saving..." : "Save Attendance Record"}
            </button>

            <p className="stat-note" aria-live="polite" style={{ marginTop: "12px" }}>
              {apiMessage}
            </p>

            <div className="status-box">
              <span
                className={
                  current >= target ? "status-dot" : "status-dot red"
                }
              />
              <div>
                <strong>{status}</strong>
                <p>
                  {current >= target
                    ? "You are currently meeting your target."
                    : "You need to attend more classes to reach your target."}
                </p>
              </div>
            </div>

            <div style={{ marginTop: "24px" }}>
              <h3 style={{ marginBottom: "12px" }}>Saved Records</h3>

              {records.length === 0 ? (
                <p className="stat-note">No saved records yet.</p>
              ) : (
                records.map((record) => (
                  <div
                    key={record.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "10px",
                      padding: "12px 0",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    <div>
                      <strong>{record.subject}</strong>
                      <p className="stat-note">
                        {record.attendedClasses}/{record.totalClasses} attended
                        {" · "}
                        {Number(record.currentAttendance).toFixed(1)}%
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        className="reset-button"
                        onClick={() => loadRecord(record)}
                      >
                        Load
                      </button>

                      <button
                        className="reset-button"
                        onClick={() => deleteRecord(record.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="panel planner" id="scenario">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">02 / WHAT IF?</span>
                <h2>Scenario Planner</h2>
                <p>Simulate your future attendance.</p>
              </div>
              <span className="panel-icon">⌁</span>
            </div>

            <div className="scenario-inputs">
              <div className="field">
                <label>Future classes you will attend</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={futureAttend}
                  onChange={(e) =>
                    setFutureAttend(Math.max(0, Number(e.target.value)))
                  }
                />
              </div>

              <div className="field">
                <label>Future classes you will miss</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={futureMiss}
                  onChange={(e) =>
                    setFutureMiss(Math.max(0, Number(e.target.value)))
                  }
                />
              </div>
            </div>

            <div className="projection">
              <span className="stat-label">PROJECTED ATTENDANCE</span>

              <div className="projection-value">
                {projected.toFixed(2)}%
              </div>

              <div className="progress">
                <div
                  className={`progress-fill ${
                    projected >= target ? "green" : "red"
                  }`}
                  style={{ width: `${Math.min(projected, 100)}%` }}
                />
              </div>

              <div className="projection-details">
                <div>
                  <span>Projected attended</span>
                  <strong>{projectedAttended}</strong>
                </div>

                <div>
                  <span>Projected total</span>
                  <strong>{projectedTotal}</strong>
                </div>

                <div>
                  <span>Target</span>
                  <strong>{target}%</strong>
                </div>
              </div>

              <div
                className={`result-box ${
                  projected >= target ? "success" : "danger"
                }`}
              >
                <strong>
                  {projected >= target
                    ? "✓ Target maintained!"
                    : "⚠ Target not maintained"}
                </strong>

                <p>
                  {projected >= target
                    ? `You can still miss ${futureSafeMisses} additional classes after this scenario.`
                    : "You need to attend more future classes to reach your target."}
                </p>
              </div>

              <button className="reset-button" onClick={resetScenario}>
                ↺ Reset scenario
              </button>
            </div>
          </div>
        </section>

        <section className="insight-panel">
          <div className="insight-icon">✦</div>
          <div>
            <span className="eyebrow">ATTENDANCE INSIGHT</span>
            <h3>Your attendance, your decisions.</h3>
            <p>
              Based on your current record, you can miss {canMiss} more
              classes without falling below your {target}% target,
              assuming no other classes are attended in between.
            </p>
          </div>
        </section>

        <footer>
          <span>ATTENDLY © 2026</span>
          <span>Plan smart. Attend better.</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
