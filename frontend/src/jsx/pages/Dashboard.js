import React, { useContext, useEffect, useState } from "react";
import { Switch, Route, Redirect } from "react-router-dom";
import { connect } from "react-redux";
import { ThemeContext } from "../../context/ThemeContext";
import NavHader from "../layouts/nav/NavHader";
import Header from "../layouts/nav/Header";
import Custom_SideBar from "../layouts/nav/Custom_SideBar";
import Home from "../components/Dashboard/Home";
import Activity from "../components/Dashboard/Activity";
import Message from "../components/Dashboard/Message";
import Profile from "../components/Dashboard/Profile";
// Calendar Integration
import EventsManagement from "../components/EventManagement/EventManagement";
// Task Management
import TasksManagement from "../components/TaskManagement/TaskManagement";
// Smart Prioritization
import SmartPrioritization from "../components/SmartPrioritization/SmartPrioritization";
// Email

import AutoReplyManager from "../components/EmailManager/AutoReply/AutoReplyManager";
import EmailManager from "../components/EmailManager/Emails/EmailManager";
// Health & Fitness (stubs)
import GoogleOAuthCallback from "../components/EventManagement/GoogleOAuthCallback";
import HealthAndFitness from "../components/HealthAndFitness/HealthAndFitness";

import Footer from "../layouts/Footer";
const Dashboard = ({ isAuthenticated }) => {
  const { changeBackground, menuToggle } = useContext(ThemeContext);
  const [toggle, setToggle] = useState("");

  useEffect(() => {
    changeBackground({ value: "light", label: "Light" });
  }, []);



  // Authentication Guard - Redirect unauthorized users
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  const noop = () => {};

  return (
    <div id="main-wrapper" className={`show ${menuToggle ? "menu-toggle" : ""}`}>
      <NavHader />
      <Header
        onNote={noop}
        onNotification={noop}
        onProfile={noop}
        toggle={toggle}
        title="Dashboard"
        onBox={() => setToggle(toggle === "box" ? "" : "box")}
        onClick={noop}
      />
      <Custom_SideBar />

      <div className="content-body" style={{ minHeight: window.screen.height - 45 }}>
        <div className="container-fluid">
          
          <Switch>
            {/* Dashboard variants */}
            <Route exact path={["/", "/dashboard"]} component={Home} />
            
            
            <Route exact path="/dashboard/activity" component={Activity} />
            <Route exact path="/dashboard/profile" component={Profile} />

            
           
            {/* Task Management */}
            <Route exact path="/tasks-management" component={TasksManagement} />
            {/* Calendar Integration */}
            <Route exact path="/events-management" component={EventsManagement} />
            <Route exact path="/calendar-callback" component={GoogleOAuthCallback} /> 

            {/* Email */}
          
            <Route exact path="/auto-reply" component={AutoReplyManager} />
            <Route exact path="/email-manager" component={EmailManager} />
            <Route exact path="/gmail-callback" component={GoogleOAuthCallback} />


            {/* Smart Prioritization */}
            <Route exact path="/smart-prioritization" component={SmartPrioritization} />
            <Route exact path="/smart-prioritization/events" component={SmartPrioritization} />
            <Route exact path="/smart-prioritization/tasks" component={SmartPrioritization} />
            <Route exact path="/smart-prioritization/event-results" component={SmartPrioritization} />
            <Route exact path="/smart-prioritization/task-results" component={SmartPrioritization} />
            <Route exact path="/smart-prioritization/preferences" component={SmartPrioritization} />
            <Route exact path="/smart-prioritization/conflicts" component={SmartPrioritization} />
            
            {/* Health & Fitness */}
            <Route path="/health-and-fitness" component={HealthAndFitness} />

          
            {/* Fallback to dashboard */}
            <Redirect to="/dashboard" />
          </Switch>
        </div>
      </div>
      <Footer />
    </div>
  );
};

// Connect to Redux store
const mapStateToProps = (state) => ({
  isAuthenticated: state.auth.user !== null
});

export default connect(mapStateToProps)(Dashboard);


