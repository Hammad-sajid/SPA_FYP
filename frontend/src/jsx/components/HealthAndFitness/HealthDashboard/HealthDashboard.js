import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Button, ProgressBar, Badge } from 'react-bootstrap';
import { FaCalculator, FaTint, FaBed, FaWalking, FaSmile, FaSave, FaHeart } from 'react-icons/fa';
import HealthService from '../../../../services/HealthService';

const HealthDashboard = ({ healthData, onDataUpdate }) => {
  const [formData, setFormData] = useState({
    bmi: '',
    waterIntake: 0,
    sleepHours: 0,
    steps: 0,
    moodScore: 5
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Load existing health data when component mounts
  useEffect(() => {
    loadLatestHealthRecord();
  }, []);

  const loadLatestHealthRecord = async () => {
    try {
      // For now, using user ID 1 - you can get this from your auth context
      const latestRecord = await HealthService.getLatestHealthRecord(1);
      if (latestRecord) {
        setFormData({
          bmi: latestRecord.bmi || '',
          waterIntake: latestRecord.water_intake || 0,
          sleepHours: latestRecord.sleep_hours || 0,
          steps: latestRecord.steps || 0,
          moodScore: latestRecord.mood_score || 5
        });
      }
    } catch (error) {
      console.log('No existing health record found or error loading:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateBMI = (weight, height) => {
    if (weight && height) {
      const heightInMeters = height / 100;
      return (weight / (heightInMeters * heightInMeters)).toFixed(1);
    }
    return '';
  };

  const getBMICategory = (bmi) => {
    if (!bmi) return '';
    if (bmi < 18.5) return { text: 'Underweight', variant: 'warning' };
    if (bmi < 25) return { text: 'Normal', variant: 'success' };
    if (bmi < 30) return { text: 'Overweight', variant: 'warning' };
    return { text: 'Obese', variant: 'danger' };
  };

  const getSleepStatus = (hours) => {
    if (hours >= 7 && hours <= 9) return { text: 'Optimal', variant: 'success' };
    if (hours >= 6 && hours <= 10) return { text: 'Good', variant: 'info' };
    return { text: 'Needs Improvement', variant: 'warning' };
  };

  const getMoodEmoji = (score) => {
    if (score >= 8) return '😊';
    if (score >= 6) return '🙂';
    if (score >= 4) return '😐';
    if (score >= 2) return '😕';
    return '😢';
  };

  // Calculate wellness score based on form data
  const calculateWellnessScore = () => {
    let totalScore = 0;
    let maxScore = 0;
    
    // BMI Score (0-25 points)
    if (formData.bmi && formData.bmi > 0) {
      const bmi = parseFloat(formData.bmi);
      if (bmi >= 18.5 && bmi < 25) {
        totalScore += 25; // Normal BMI
      } else if ((bmi >= 17 && bmi < 18.5) || (bmi >= 25 && bmi < 30)) {
        totalScore += 15; // Slightly under/overweight
      } else if (bmi >= 16 && bmi < 17 || bmi >= 30 && bmi < 35) {
        totalScore += 10; // Under/overweight
      } else {
        totalScore += 5; // Very under/overweight
      }
      maxScore += 25;
    }
    
    // Water Intake Score (0-20 points)
    if (formData.waterIntake > 0) {
      if (formData.waterIntake >= 8) {
        totalScore += 20; // Optimal
      } else if (formData.waterIntake >= 6) {
        totalScore += 15; // Good
      } else if (formData.waterIntake >= 4) {
        totalScore += 10; // Fair
      } else {
        totalScore += 5; // Poor
      }
      maxScore += 20;
    }
    
    // Sleep Score (0-25 points)
    if (formData.sleepHours > 0) {
      if (formData.sleepHours >= 7 && formData.sleepHours <= 9) {
        totalScore += 25; // Optimal
      } else if (formData.sleepHours >= 6 && formData.sleepHours <= 10) {
        totalScore += 20; // Good
      } else if (formData.sleepHours >= 5 && formData.sleepHours <= 11) {
        totalScore += 15; // Fair
      } else {
        totalScore += 10; // Poor
      }
      maxScore += 25;
    }
    
    // Steps Score (0-20 points)
    if (formData.steps > 0) {
      if (formData.steps >= 10000) {
        totalScore += 20; // Excellent
      } else if (formData.steps >= 8000) {
        totalScore += 18; // Very good
      } else if (formData.steps >= 6000) {
        totalScore += 15; // Good
      } else if (formData.steps >= 4000) {
        totalScore += 10; // Fair
      } else {
        totalScore += 5; // Poor
      }
      maxScore += 20;
    }
    
    // Mood Score (0-10 points)
    if (formData.moodScore > 0) {
      totalScore += formData.moodScore;
      maxScore += 10;
    }
    
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    
    // Determine grade
    let grade = { text: 'Excellent', variant: 'success', icon: '🏆' };
    if (percentage >= 90) {
      grade = { text: 'Excellent', variant: 'success', icon: '🏆' };
    } else if (percentage >= 80) {
      grade = { text: 'Very Good', variant: 'info', icon: '⭐' };
    } else if (percentage >= 70) {
      grade = { text: 'Good', variant: 'primary', icon: '👍' };
    } else if (percentage >= 60) {
      grade = { text: 'Fair', variant: 'warning', icon: '⚠️' };
    } else {
      grade = { text: 'Needs Improvement', variant: 'danger', icon: '📈' };
    }
    
    return {
      percentage,
      grade,
      factors: [
        { 
          name: 'BMI', 
          score: formData.bmi && formData.bmi > 0 ? (totalScore - (maxScore - 25)) : 0, 
          max: 25 
        },
        { 
          name: 'Hydration', 
          score: formData.waterIntake > 0 ? (formData.waterIntake >= 8 ? 20 : formData.waterIntake >= 6 ? 15 : formData.waterIntake >= 4 ? 10 : 5) : 0, 
          max: 20 
        },
        { 
          name: 'Sleep', 
          score: formData.sleepHours > 0 ? (formData.sleepHours >= 7 && formData.sleepHours <= 9 ? 25 : formData.sleepHours >= 6 && formData.sleepHours <= 10 ? 20 : formData.sleepHours >= 5 && formData.sleepHours <= 11 ? 15 : 10) : 0, 
          max: 25 
        },
        { 
          name: 'Activity', 
          score: formData.steps > 0 ? (formData.steps >= 10000 ? 20 : formData.steps >= 8000 ? 18 : formData.steps >= 6000 ? 15 : formData.steps >= 4000 ? 10 : 5) : 0, 
          max: 20 
        },
        { 
          name: 'Mood', 
          score: formData.moodScore > 0 ? formData.moodScore : 0, 
          max: 10 
        }
      ]
    };
  };

  // Get current wellness score
  const wellnessScore = calculateWellnessScore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const today = new Date().toISOString().split('T')[0];
      const healthRecord = {
        user_id: 1, // Replace with actual user ID from auth
        record_date: today,
        bmi: parseFloat(formData.bmi) || null,
        water_intake: parseInt(formData.waterIntake) || 0,
        sleep_hours: parseFloat(formData.sleepHours) || 0,
        steps: parseInt(formData.steps) || 0,
        mood_score: parseInt(formData.moodScore) || 5,
        wellness_score: wellnessScore.percentage // Will be calculated by backend
      };

      const result = await HealthService.createHealthRecord(healthRecord);
      
      setMessage({ 
        text: 'Health data saved successfully!', 
        type: 'success' 
      });

      // Update parent component
      onDataUpdate('bmi', parseFloat(formData.bmi) || null);
      onDataUpdate('waterIntake', parseInt(formData.waterIntake) || 0);
      onDataUpdate('sleepHours', parseFloat(formData.sleepHours) || 0);
      onDataUpdate('steps', parseInt(formData.steps) || 0);
      onDataUpdate('moodScore', parseInt(formData.moodScore) || 5);

      // Clear form after successful save
      setTimeout(() => {
        setMessage({ text: '', type: '' });
      }, 3000);

    } catch (error) {
      console.error('Error saving health data:', error);
      setMessage({ 
        text: 'Error saving health data. Please try again.', 
        type: 'danger' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {message.text && (
        <div className={`alert alert-${message.type} alert-dismissible fade show`} role="alert">
          {message.text}
          <button type="button" className="btn-close" onClick={() => setMessage({ text: '', type: '' })}></button>
        </div>
      )}

      {/* Wellness Score Overview */}
      <Row className="mb-4">
        <Col md={12}>
          <Card className="border-0 shadow-sm wellness-score-card">
            <Card.Body className="text-center p-4">
              <div className="d-flex align-items-center justify-content-center mb-3">
                <FaHeart className="text-danger me-3" size={32} />
                <h2 className="mb-0">Wellness Score</h2>
              </div>
              <div className="row align-items-center">
                <Col md={4}>
                  <div className="wellness-percentage text-primary">
                    {wellnessScore.percentage}%
                  </div>
                  <Badge bg={wellnessScore.grade.variant} className="wellness-grade">
                    {wellnessScore.grade.icon} {wellnessScore.grade.text}
                  </Badge>
                </Col>
                <Col md={8}>
                  <div className="row factor-progress">
                    {wellnessScore.factors.map((factor, index) => (
                      <Col key={index} md={6} className="mb-2">
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="factor-label">{factor.name}:</span>
                          <span className="factor-score">
                            {factor.score}/{factor.max}
                          </span>
                        </div>
                        <ProgressBar 
                          now={(factor.score / factor.max) * 100} 
                          variant={factor.score / factor.max >= 0.8 ? 'success' : factor.score / factor.max >= 0.6 ? 'info' : 'warning'}
                          className="mt-1"
                          style={{ height: '8px' }}
                        />
                      </Col>
                    ))}
                  </div>
                </Col>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Form onSubmit={handleSubmit}>
        <Row>
          {/* BMI Calculator */}
          <Col md={6} className="mb-4">
            <Card>
              <Card.Header className="bg-primary text-white">
                <FaCalculator className="me-2" />
                BMI Calculator & Tracking
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Weight (kg)</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.1"
                        placeholder="70.5"
                        value={formData.weight || ''}
                        onChange={(e) => {
                          const weight = e.target.value;
                          const bmi = calculateBMI(weight, formData.height);
                          setFormData(prev => ({ ...prev, weight, bmi }));
                        }}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Height (cm)</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.1"
                        placeholder="175"
                        value={formData.height || ''}
                        onChange={(e) => {
                          const height = e.target.value;
                          const bmi = calculateBMI(formData.weight, height);
                          setFormData(prev => ({ ...prev, height, bmi }));
                        }}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                {formData.bmi && (
                  <div className="text-center">
                    <h4>Your BMI: {formData.bmi}</h4>
                    <Badge bg={getBMICategory(formData.bmi).variant}>
                      {getBMICategory(formData.bmi).text}
                    </Badge>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Water Intake Tracker */}
          <Col md={6} className="mb-4">
            <Card>
              <Card.Header className="bg-info text-white">
                <FaTint className="me-2" />
                Water Intake Tracker
              </Card.Header>
              <Card.Body>
                <div className="text-center mb-3">
                  <h4>{formData.waterIntake}/8 glasses</h4>
                  <ProgressBar 
                    now={(formData.waterIntake / 8) * 100} 
                    variant="info" 
                    className="mb-3"
                  />
                </div>
                <div className="d-flex justify-content-center gap-2">
                  <Button
                    variant="outline-info"
                    size="sm"
                    onClick={() => handleInputChange('waterIntake', Math.max(0, formData.waterIntake - 1))}
                  >
                    -
                  </Button>
                  <Button
                    variant="outline-info"
                    size="sm"
                    onClick={() => handleInputChange('waterIntake', Math.min(20, formData.waterIntake + 1))}
                  >
                    +
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          {/* Sleep Quality Monitor */}
          <Col md={6} className="mb-4">
            <Card>
              <Card.Header className="bg-dark text-white">
                <FaBed className="me-2" />
                Sleep Quality Monitor
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Sleep Duration (hours)</Form.Label>
                  <Form.Select
                    value={formData.sleepHours}
                    onChange={(e) => handleInputChange('sleepHours', parseFloat(e.target.value))}
                  >
                    <option value={0}>Select hours</option>
                    {[4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map(hour => (
                      <option key={hour} value={hour}>{hour} hours</option>
                    ))}
                  </Form.Select>
                </Form.Group>
                {formData.sleepHours > 0 && (
                  <div className="text-center">
                    <Badge bg={getSleepStatus(formData.sleepHours).variant}>
                      {getSleepStatus(formData.sleepHours).text}
                    </Badge>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Step Counter */}
          <Col md={6} className="mb-4">
            <Card>
              <Card.Header className="bg-success text-white">
                <FaWalking className="me-2" />
                Step Counter & Activity Goals
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Daily Steps</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="8000"
                    value={formData.steps}
                    onChange={(e) => handleInputChange('steps', parseInt(e.target.value) || 0)}
                  />
                </Form.Group>
                <div className="text-center">
                  <h5>Goal: 10,000 steps</h5>
                  <ProgressBar 
                    now={(formData.steps / 10000) * 100} 
                    variant="success"
                    label={`${Math.round((formData.steps / 10000) * 100)}%`}
                  />
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          {/* Mood Tracker */}
          <Col md={6} className="mb-4">
            <Card>
              <Card.Header className="bg-warning text-dark">
                <FaSmile className="me-2" />
                Mood Tracker
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>How are you feeling today? (1-10)</Form.Label>
                  <div className="d-flex align-items-center gap-3">
                    <span>😢</span>
                    <Form.Range
                      min="1"
                      max="10"
                      value={formData.moodScore}
                      onChange={(e) => handleInputChange('moodScore', parseInt(e.target.value))}
                    />
                    <span>😊</span>
                  </div>
                  <div className="text-center mt-2">
                    <h4>{getMoodEmoji(formData.moodScore)} {formData.moodScore}/10</h4>
                  </div>
                </Form.Group>
              </Card.Body>
            </Card>
          </Col>

          {/* Wellness Score Overview */}
          <Col md={6} className="mb-4">
            <Card>
              <Card.Header className="bg-secondary text-white">
                <FaSmile className="me-2" />
                Wellness Score Overview
              </Card.Header>
              <Card.Body>
                <div className="text-center mb-3">
                  <h4>{wellnessScore.percentage}%</h4>
                  <Badge bg={wellnessScore.grade.variant}>
                    {wellnessScore.grade.text}
                  </Badge>
                </div>
                <div className="d-flex justify-content-center gap-2">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => handleInputChange('moodScore', Math.max(1, formData.moodScore - 1))}
                  >
                    -
                  </Button>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => handleInputChange('moodScore', Math.min(10, formData.moodScore + 1))}
                  >
                    +
                  </Button>
                </div>
                <div className="mt-4">
                  <h6>Key Factors:</h6>
                  {wellnessScore.factors.map((factor, index) => (
                    <div key={index} className="d-flex justify-content-between align-items-center mb-1">
                      <span>{factor.name}: {factor.score}/{factor.max}</span>
                      <ProgressBar 
                        now={(factor.score / factor.max) * 100} 
                        variant={factor.name.includes('Mood') ? 'warning' : factor.name.includes('BMI') ? 'danger' : factor.name.includes('Sleep') ? 'info' : 'success'}
                        className="flex-grow-1 ms-2"
                        style={{ height: '10px' }}
                      />
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Save Button */}
        <Row className="mt-4">
          <Col md={12} className="d-flex justify-content-center">
            <Card className="w-100">
              <Card.Body className="text-center">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={loading}
                  className="w-100"
                >
                  <FaSave className="me-2" />
                  {loading ? 'Saving...' : 'Save Health Data'}
                </Button>
                <p className="text-muted mt-2 mb-0">
                  Save your daily health metrics to track your progress
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default HealthDashboard;
