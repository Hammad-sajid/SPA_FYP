import React, { Fragment, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import profileImage from "../../../../../images/avatar/1.jpg";

import { Dropdown, Button, Form } from "react-bootstrap";
import PageTitle from "../../../../layouts/PageTitle";
import EmailService from "../../../../../services/EmailService";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

const Read = () => {
  const query = useQuery();
  const id = query.get("id");
  const [email, setEmail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [moveCategory, setMoveCategory] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const res = await EmailService.get(id);
        setEmail(res);
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const toggleRead = async (toRead) => {
    if (!email) return;
    setUpdating(true);
    try {
      const updated = await EmailService.update(email.id, { read: toRead });
      setEmail(updated);
    } finally {
      setUpdating(false);
    }
  };

  const applyCategory = async () => {
    if (!email || !moveCategory) return;
    setUpdating(true);
    try {
      const updated = await EmailService.update(email.id, { category: moveCategory });
      setEmail(updated);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Fragment>
      <PageTitle pageContent="Email" activeMenu="Read" motherMenu="Email" />
      <div className="row">
        <div className="col-lg-12">
          <div className="card">
            <div className="card-body">
                <div className="row">
                    <div className="col-xl-3 col-lg-4">
                      <div className="email-left-box generic-width px-0 mb-5">
                            <div className="p-0">
                              <Link
                                to="/email-compose"
                                className="btn btn-primary btn-block"
                              >
                                Compose
                              </Link>
                            </div>
                            <div className="mail-list rounded mt-4">
                              <Link to="/email-inbox" className="list-group-item active">
                                <i className="fa fa-inbox font-18 align-middle me-2"></i>
                                Inbox
                                <span className="badge badge-primary badge-sm float-end">
                                  198
                                </span>
                              </Link>
                              <Link to="/email-read" className="list-group-item">
                                <i className="fa fa-paper-plane font-18 align-middle me-2"></i>
                                Sent
                              </Link>
                              <Link to="/email-read" className="list-group-item">
                                <i className="fa fa-star font-18 align-middle me-2"></i>
                                Important
                                <span className="badge badge-danger badge-sm text-white float-end">
                                  47
                                </span>
                              </Link>
                              <Link to="/email-read" className="list-group-item">
                                <i className="mdi mdi-file-document-box font-18 align-middle me-2"></i>
                                Draft
                              </Link>
                              <Link to="/email-read" className="list-group-item">
                                <i className="fa fa-trash font-18 align-middle me-2"></i>
                                Trash
                              </Link>
                            </div>
                            <div className="mail-list rounded overflow-hidden mt-4">
                              <div className="intro-title d-flex justify-content-between my-0">
                                <h5>Categories</h5>
                                <i className="fa fa-chevron-down" aria-hidden="true"></i>
                              </div>
                              <Link to="/email-inbox" className="list-group-item">
                                <span className="icon-warning">
                                  <i className="fa fa-circle" aria-hidden="true"></i>
                                </span>
                                Work
                              </Link>
                              <Link to="/email-inbox" className="list-group-item">
                                <span className="icon-primary">
                                  <i className="fa fa-circle" aria-hidden="true"></i>
                                </span>
                                Private
                              </Link>
                              <Link to="/email-inbox" className="list-group-item">
                                <span className="icon-success">
                                  <i className="fa fa-circle" aria-hidden="true"></i>
                                </span>
                                Support
                              </Link>
                              <Link to="/email-inbox" className="list-group-item">
                                <span className="icon-dpink">
                                  <i className="fa fa-circle" aria-hidden="true"></i>
                                </span>
                                Social
                              </Link>
                            </div>
                          </div>
                    </div>
                    <div className="col-xl-9 col-lg-8">
                        <div className="email-right-box">
                          <div className="row">
                            <div className="col-12">
                              <div className="right-box-padding">
                                <div className="toolbar mb-4" role="toolbar">
                                  <div className="btn-group mb-1">
                                    <button
                                      type="button"
                                      className="btn btn-primary light px-3"
                                    >
                                      <i className="fa fa-archive"></i>
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-primary light px-3"
                                    >
                                      <i className="fa fa-exclamation-circle"></i>
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-primary light px-3"
                                    >
                                      <i className="fa fa-trash"></i>
                                    </button>
                                  </div>
                                  <Dropdown className="btn-group mb-1">
                                    <Dropdown.Toggle
                                      type="button"
                                      className="btn btn-primary light dropdown-toggle px-3 ms-1"
                                      data-toggle="dropdown"
                                    >
                                      <i className="fa fa-folder"></i>
                                      <b className="caret m-l-5"></b>
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu className="dropdown-menu">
                                      <Dropdown.Item
                                        as="a"
                                        className="dropdown-item"
                                        to="/email-read"
                                      >
                                        Social
                                      </Dropdown.Item>
                                      <Dropdown.Item
                                        as="a"
                                        className="dropdown-item"
                                        to="/email-read"
                                      >
                                        Promotions
                                      </Dropdown.Item>
                                      <Dropdown.Item
                                        as="a"
                                        className="dropdown-item"
                                        to="/email-read"
                                      >
                                        Updates
                                      </Dropdown.Item>
                                      <Dropdown.Item
                                        as="a"
                                        className="dropdown-item"
                                        to="/email-read"
                                      >
                                        Forums
                                      </Dropdown.Item>
                                    </Dropdown.Menu>
                                  </Dropdown>
                                  <Dropdown className="btn-group mb-1">
                                    <Dropdown.Toggle
                                      className="btn btn-primary light dropdown-toggle px-3 ms-1"
                                      data-toggle="dropdown"
                                    >
                                      <i className="fa fa-tag"></i>
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu>
                                      <Dropdown.Item as="a">Updates</Dropdown.Item>
                                      <Dropdown.Item as="a">Social</Dropdown.Item>
                                      <Dropdown.Item as="a">Promotions</Dropdown.Item>
                                      <Dropdown.Item as="a">Forums</Dropdown.Item>
                                    </Dropdown.Menu>
                                  </Dropdown>
                                  <Dropdown className="btn-group mb-1">
                                    <Dropdown.Toggle
                                      type="button"
                                      className="btn btn-primary light dropdown-toggle v ms-1"
                                      data-toggle="dropdown"
                                    >
                                      More <span className="caret m-l-5"></span>
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu className="dropdown-menu">
                                      <Dropdown.Item
                                        className="dropdown-item"
                                        to="/email-read"
                                      >
                                        Mark as Unread
                                      </Dropdown.Item>
                                      <Dropdown.Item
                                        className="dropdown-item"
                                        to="/email-read"
                                      >
                                        Add to Tasks
                                      </Dropdown.Item>
                                      <Dropdown.Item
                                        className="dropdown-item"
                                        to="/email-read"
                                      >
                                        Add Star
                                      </Dropdown.Item>
                                      <Dropdown.Item
                                        className="dropdown-item"
                                        to="/email-read"
                                      >
                                        Mute
                                      </Dropdown.Item>
                                    </Dropdown.Menu>
                                  </Dropdown>
                                </div>
                                  <div className="read-content">
                                    <div className="media pt-3 d-sm-flex d-block justify-content-between">
                                      <div className="clearfix mb-3 d-flex">
                                        <img className="me-3 rounded" width="70" alt="" src={profileImage}/>
                                        <div className="media-body me-2">
                                          <h5 className="text-primary mb-0 mt-1">Ingredia Nutrisha</h5>
                                          <p className="mb-0">20 May 2022</p>
                                        </div>
                                      </div>	
                                      <div className="clearfix mb-3">
                                        <Link
                                          to="/email-read"
                                          className="btn btn-primary px-3 light me-2"
                                        >
                                          <i className="fa fa-reply"></i>
                                        </Link>
                                        <Link
                                          to="/email-read"
                                          className="btn btn-primary px-3 light me-2"
                                        >
                                          <i className="fas fa-arrow-right"></i>
                                        </Link>
                                        <Link
                                          to="/email-read"
                                          className="btn btn-primary px-3 light me-2"
                                        >
                                          <i className="fa fa-trash"></i>
                                        </Link>
                                      </div>
                                    </div>
                                    <hr />
                                  <div className="media mb-2 mt-3">
                                    <div className="media-body">
                                      <span className="pull-end">{email?.received_at ? new Date(email.received_at).toLocaleString() : ""}</span>
                                      <h5 className="my-1 text-primary">
                                        {email?.subject || "Subject"}
                                      </h5>
                                      <p className="read-content-email">
                                        From: {email?.sender || "unknown"}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="d-flex gap-2 mb-3">
                                    <Button size="sm" variant="primary" as={Link} to={`/email-compose?replyTo=${id}`}>Reply</Button>
                                    <Button size="sm" variant="outline-primary" as={Link} to={`/email-compose?forward=${id}`}>Forward</Button>
                                    {email?.read ? (
                                      <Button size="sm" variant="secondary" disabled={updating} onClick={()=>toggleRead(false)}>Mark as Unread</Button>
                                    ) : (
                                      <Button size="sm" variant="success" disabled={updating} onClick={()=>toggleRead(true)}>Mark as Read</Button>
                                    )}
                                    <Form.Select size="sm" style={{ width: 180 }} value={moveCategory} onChange={(e)=>setMoveCategory(e.target.value)}>
                                      <option value="">Move to…</option>
                                      {['inbox','sent','draft','trash','work','personal','support','social','starred'].map(opt=> (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                    </Form.Select>
                                    <Button size="sm" variant="outline-secondary" disabled={!moveCategory || updating} onClick={applyCategory}>Apply</Button>
                                  </div>
                                  <div className="read-content-body">
                                    {loading && <div className="text-muted">Loading...</div>}
                                    {!loading && (
                                      <div style={{ whiteSpace: 'pre-wrap' }}>
                                        {email?.body || "No content"}
                                      </div>
                                    )}
                                    <hr />
                                  </div>
                                  <div className="read-content-attachment">
                                    <h6>
                                      <i className="fa fa-paperclip mb-2"></i>
                                      Attachments
                                    </h6>
                                    <div className="row attachment">
                                      <div className="col-12 text-muted">No attachments</div>
                                    </div>
                                  </div>
                                  <hr />
                                  <div className="mb-3 pt-3">
                                    <textarea
                                      name="write-email"
                                      id="write-email"
                                      cols="30"
                                      rows="5"
                                      className="form-control"
                                      placeholder="It's really an amazing.I want to know more about it..!"
                                    ></textarea>
                                  </div>
                                </div>
                                <div className="text-end">
                                  <button className="btn btn-primary " type="button">
                                    Send
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                    </div>
                </div>
                    
                    
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export default Read;
