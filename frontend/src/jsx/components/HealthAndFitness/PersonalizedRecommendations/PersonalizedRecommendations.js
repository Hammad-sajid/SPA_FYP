import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, Button, Spinner, Alert } from 'react-bootstrap';
import { FaBrain, FaAppleAlt, FaDumbbell, FaBed, FaHeart, FaTint, FaLightbulb } from 'react-icons/fa';
import HealthService from '../../../../services/HealthService';

const PersonalizedRecommendations = ({ healthData }) => {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Generate AI recommendations when component mounts or health data changes
  useEffect(() => {
    if (healthData && Object.values(healthData).some(val => val !== null && val !== 0)) {
      generateAIRecommendations();
    }
  }, [healthData]);

  const generateAIRecommendations = async () => {
    setLoading(true);
    setError('');

    try {
      const aiData = {
        bmi: healthData.bmi,
        water_intake: healthData.waterIntake,
        sleep_hours: healthData.sleepHours,
        steps: healthData.steps,
        mood_score: healthData.moodScore,
        wellness_score: healthData.wellnessScore,
        user_age: 25, // You can get this from user profile
        user_gender: 'not_specified', // You can get this from user profile
        user_activity_level: 'moderate' // You can get this from user profile
      };

      const response = await HealthService.getAIHealthRecommendations(aiData);
      
      if (response.success) {
        setRecommendations(response.data);
      } else {
        setError('Failed to generate AI recommendations');
      }
    } catch (error) {
      console.error('Error getting AI recommendations:', error);
      setError('Error connecting to AI service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'secondary';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'nutrition': return <FaAppleAlt className="me-2" />;
      case 'exercise': return <FaDumbbell className="me-2" />;
      case 'sleep': return <FaBed className="me-2" />;
      case 'wellness': return <FaHeart className="me-2" />;
      case 'hydration': return <FaTint className="me-2" />;
      case 'mental_health': return <FaBrain className="me-2" />;
      default: return <FaLightbulb className="me-2" />;
    }
  };

  const filteredRecommendations = recommendations?.recommendations?.filter(rec => 
    selectedCategory === 'all' || rec.category === selectedCategory
  ) || [];

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Generating personalized health recommendations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="mb-4">
        <Alert.Heading>Error</Alert.Heading>
        <p>{error}</p>
        <Button variant="outline-danger" onClick={generateAIRecommendations}>
          Try Again
        </Button>
      </Alert>
    );
  }

  return (
    <div>
      <h4 className="mb-4">🧠 AI-Powered Health Recommendations</h4>

      {/* Health Assessment */}
      {recommendations?.health_assessment && (
        <Card className="mb-4 border-primary">
          <Card.Body className="bg-primary bg-opacity-10">
            <h5 className="text-primary">
              <FaBrain className="me-2" />
              Health Assessment
            </h5>
            <p className="mb-0">{recommendations.health_assessment}</p>
          </Card.Body>
        </Card>
      )}

      {/* Category Filter */}
      <Card className="mb-4">
        <Card.Body>
          <h6 className="mb-3">Filter by Category:</h6>
          <div className="d-flex flex-wrap gap-2">
            {['all', 'nutrition', 'exercise', 'sleep', 'wellness', 'hydration', 'mental_health'].map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'primary' : 'outline-primary'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {getCategoryIcon(category)}
                {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}
              </Button>
            ))}
          </div>
        </Card.Body>
      </Card>

      {/* AI Recommendations */}
      {filteredRecommendations.length > 0 ? (
        <Row>
          {filteredRecommendations.map((rec, index) => (
            <Col lg={6} md={12} key={index} className="mb-4">
              <Card className="h-100">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <span>
                    {getCategoryIcon(rec.category)}
                    {rec.category.charAt(0).toUpperCase() + rec.category.slice(1).replace('_', ' ')}
                  </span>
                  <Badge bg={getPriorityColor(rec.priority)}>
                    {rec.priority?.toUpperCase() || 'MEDIUM'}
                  </Badge>
                </Card.Header>
                <Card.Body>
                  <h6 className="card-title">{rec.title}</h6>
                  <p className="card-text">{rec.description}</p>
                  
                  {rec.action_items && rec.action_items.length > 0 && (
                    <div className="mb-3">
                      <strong>Action Items:</strong>
                      <ul className="mb-0 mt-2">
                        {rec.action_items.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {rec.expected_benefits && (
                    <div className="mb-3">
                      <strong>Expected Benefits:</strong>
                      <p className="mb-0 text-muted">{rec.expected_benefits}</p>
                    </div>
                  )}
                  
                  <div className="d-flex justify-content-between align-items-center">
                    <Badge bg="secondary">
                      Difficulty: {rec.difficulty || 'Moderate'}
                    </Badge>
                    <small className="text-muted">
                      {rec.category === 'exercise' ? '💪' : 
                       rec.category === 'nutrition' ? '🥗' : 
                       rec.category === 'sleep' ? '😴' : '✨'}
                    </small>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Card className="text-center py-5">
          <Card.Body>
            <FaLightbulb className="display-4 text-muted mb-3" />
            <h5>No recommendations available</h5>
            <p className="text-muted">
              {selectedCategory === 'all' 
                ? 'Complete your health data to get personalized recommendations'
                : `No ${selectedCategory} recommendations available for your current health data`
              }
            </p>
            {selectedCategory !== 'all' && (
              <Button variant="outline-primary" onClick={() => setSelectedCategory('all')}>
                View All Recommendations
              </Button>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Next Steps */}
      {recommendations?.next_steps && (
        <Card className="mt-4 border-success">
          <Card.Body className="bg-success bg-opacity-10">
            <h5 className="text-success">
              <FaLightbulb className="me-2" />
              Next Steps
            </h5>
            <p className="mb-0">{recommendations.next_steps}</p>
          </Card.Body>
        </Card>
      )}

      {/* Quick Action Cards */}
      <Row className="mt-4">
        <Col md={3} className="mb-3">
          <Card className="text-center h-100">
            <Card.Body>
              <FaAppleAlt className="display-4 text-success mb-3" />
              <h6>Nutrition Tips</h6>
              <p className="small text-muted">Get personalized meal suggestions</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="text-center h-100">
            <Card.Body>
              <FaDumbbell className="display-4 text-primary mb-3" />
              <h6>Exercise Plans</h6>
              <p className="small text-muted">Workout routines for your fitness level</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="text-center h-100">
            <Card.Body>
              <FaBed className="display-4 text-dark mb-3" />
              <h6>Sleep Guide</h6>
              <p className="small text-muted">Improve your sleep quality</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="text-center h-100">
            <Card.Body>
              <FaHeart className="display-4 text-danger mb-3" />
              <h6>Wellness Tips</h6>
              <p className="small text-muted">Holistic health advice</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Stress Management Section */}
      <Card className="mt-4">
        <Card.Header className="bg-warning text-dark">
          <FaBrain className="me-2" />
          Stress Management & Mental Wellness
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <h6>Breathing Exercise</h6>
              <p className="text-muted">
                Practice the 4-7-8 breathing technique: Inhale for 4 seconds, 
                hold for 7 seconds, exhale for 8 seconds. Repeat 4 times.
              </p>
            </Col>
            <Col md={6}>
              <h6>Quick Meditation</h6>
              <p className="text-muted">
                Take 5 minutes to sit quietly, focus on your breath, 
                and let thoughts pass without judgment.
              </p>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </div>
  );
};

export default PersonalizedRecommendations;
