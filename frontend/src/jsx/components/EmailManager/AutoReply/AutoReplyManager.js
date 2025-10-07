import React, { useState } from 'react';
import { Card, Row, Col, Nav, Tab } from 'react-bootstrap';
import { FaRobot, FaBrain, FaMagic } from 'react-icons/fa';
import AIResponseGenerator from './AIResponseGenerator';

const AutoReplyManager = () => {
  const [activeTab, setActiveTab] = useState('ai-generator');

  const tabs = [
    {
      key: 'ai-generator',
      title: 'AI Response Generator',
      icon: <FaBrain className="me-2" />,
      description: 'Generate intelligent email responses using AI',
      component: <AIResponseGenerator />
    }
  ];

  return (
    <div className="auto-reply-manager">
      <Card>
        <div className="card-header">
          <div className="d-flex align-items-center">
            <FaRobot className="fa-1x text-primary me-3" />
            <div>
              <h4 className="mb-1">AI Response Generator</h4>
              <p className="text-muted mb-0">
                Generate intelligent email responses using AI
              </p>
            </div>
          </div>
        </div>

        <div className="card-body">
          <Row>
            <Col lg={12}>
              <Tab.Content>
                {tabs.map((tab) => (
                  <Tab.Pane
                    key={tab.key}
                    active={activeTab === tab.key}
                    className="fade show"
                  >
                    
                    {tab.component}
                  </Tab.Pane>
                ))}
              </Tab.Content>
            </Col>
          </Row>
        </div>
      </Card>
    </div>
  );
};

export default AutoReplyManager;

