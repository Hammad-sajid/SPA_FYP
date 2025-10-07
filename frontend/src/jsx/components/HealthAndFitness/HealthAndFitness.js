import React, { useState, useEffect } from 'react';
import { Switch, Route, Redirect, useRouteMatch, useHistory, useLocation } from 'react-router-dom';
import { Card, Row, Col, Nav } from 'react-bootstrap';
import { FaHeartbeat, FaBrain, FaBell, FaChartLine } from 'react-icons/fa';

// Import health components
import HealthDashboard from './HealthDashboard/HealthDashboard';
import PersonalizedRecommendations from './PersonalizedRecommendations/PersonalizedRecommendations';
import SmartReminders from './SmartReminders/SmartReminders';

const HealthAndFitness = () => {
  const { path, url } = useRouteMatch();
  const history = useHistory();
  const location = useLocation();
  
  const [healthData, setHealthData] = useState({
    bmi: null,
    waterIntake: 0,
    sleepHours: 0,
    steps: 0,
    mood: 5,
    wellnessScore: 0
  });

  // Calculate wellness score based on health data
  useEffect(() => {
    const calculateWellnessScore = () => {
      let score = 0;
      
      // BMI score (0-20 points)
      if (healthData.bmi && healthData.bmi >= 18.5 && healthData.bmi <= 24.9) {
        score += 20;
      } else if (healthData.bmi && healthData.bmi >= 17 && healthData.bmi <= 29.9) {
        score += 15;
      } else if (healthData.bmi) {
        score += 10;
      }
      
      // Water intake score (0-20 points)
      if (healthData.waterIntake >= 8) score += 20;
      else if (healthData.waterIntake >= 6) score += 15;
      else if (healthData.waterIntake >= 4) score += 10;
      
      // Sleep score (0-20 points)
      if (healthData.sleepHours >= 7 && healthData.sleepHours <= 9) score += 20;
      else if (healthData.sleepHours >= 6 && healthData.sleepHours <= 10) score += 15;
      else if (healthData.sleepHours >= 5) score += 10;
      
      // Steps score (0-20 points)
      if (healthData.steps >= 10000) score += 20;
      else if (healthData.steps >= 8000) score += 15;
      else if (healthData.steps >= 6000) score += 10;
      
      // Mood score (0-20 points)
      if (healthData.mood >= 7) score += 20;
      else if (healthData.mood >= 5) score += 15;
      else if (healthData.mood >= 3) score += 10;
      
      setHealthData(prev => ({ ...prev, wellnessScore: score }));
    };

    calculateWellnessScore();
  }, [healthData.bmi, healthData.waterIntake, healthData.sleepHours, healthData.steps, healthData.mood]);

  const handleHealthDataUpdate = (field, value) => {
    setHealthData(prev => ({ ...prev, [field]: value }));
  };

  // Get current active tab from URL
  const getActiveTab = () => {
    if (location.pathname.includes('/dashboard')) return 'dashboard';
    if (location.pathname.includes('/recommendations')) return 'recommendations';
    if (location.pathname.includes('/reminders')) return 'reminders';
    return 'dashboard';
  };

  const activeTab = getActiveTab();

  return (
    <div className="col-lg-12">
      <Card className="mt-4">
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">
            <FaHeartbeat className="me-2" />
            Health & Fitness Module
          </h5>
        </Card.Header>
        <Card.Body>
          {/* Wellness Score Overview */}
          <Row className="mb-4">
            <Col md={12}>
              <Card className="border-0 bg-gradient-primary text-white">
                {/* <Card.Body className="text-center">
                  <h3 className="mb-2 text-secondary">Your Wellness Score</h3>
                  <div className="display-4 fw-bold mb-2 text-secondary">{healthData.wellnwell/100</div>
                  <div className="progress bg-white bg-opacity-25" style={{ height: '10px' }}>
                    <div 
                      className="progress-bar bg-white" 
                      style={{ width: `${healthData.wellnessScore}%` }}
                    ></div>
                  </div>
                  <p className="mb-0 mt-2 text-secondary">
                    {healthData.wellnessScore >= 80 ? 'Excellent! Keep up the great work!' :
                     healthData.wellnessScore >= 60 ? 'Good! You\'re on the right track!' :
                     healthData.wellnessScore >= 40 ? 'Fair! Room for improvement!' :
                     'Let\'s work on improving your health habits!'}
                  </p>
                </Card.Body> */}
              </Card>
            </Col>
          </Row>

          {/* Navigation Tabs */}
          <Row>
            <Col md={12}>
              <Nav variant="tabs" className="mb-4">
                <Nav.Item>
                  <Nav.Link 
                    onClick={() => history.push(`${url}/dashboard`)}
                    className={activeTab === 'dashboard' ? 'active' : ''}
                    style={{ cursor: 'pointer' }}
                  >
                    <FaChartLine className="me-2" />
                    Health Dashboard
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    onClick={() => history.push(`${url}/recommendations`)}
                    className={activeTab === 'recommendations' ? 'active' : ''}
                    style={{ cursor: 'pointer' }}
                  >
                    <FaBrain className="me-2" />
                    AI Recommendations
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    onClick={() => history.push(`${url}/reminders`)}
                    className={activeTab === 'reminders' ? 'active' : ''}
                    style={{ cursor: 'pointer' }}
                  >
                    <FaBell className="me-2" />
                    Smart Reminders
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </Col>
          </Row>

          {/* Tab Content with Routing */}
          <Switch>
            <Route exact path={path}>
              <Redirect to={`${path}/dashboard`} />
            </Route>
            <Route path={`${path}/dashboard`}>
              <HealthDashboard 
                healthData={healthData} 
                onDataUpdate={handleHealthDataUpdate}
              />
            </Route>
            <Route path={`${path}/recommendations`}>
              <PersonalizedRecommendations 
                healthData={healthData}
              />
            </Route>
            <Route path={`${path}/reminders`}>
              <SmartReminders />
            </Route>
          </Switch>
        </Card.Body>
      </Card>
    </div>
  );
};

export default HealthAndFitness;
