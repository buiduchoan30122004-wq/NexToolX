import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from '../config';
import { 
  Bell, 
  Edit, 
  Users, 
  Trash, 
  Link2, 
  Globe, 
  Award, 
  Zap, 
  Mail, 
  ShoppingBag 
} from 'lucide-react';

function Dashboard() {
  const [data, setData] = useState(null);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  // Bộ lọc nhánh công cụ (All, Paid, Affiliate)
  const [toolTab, setToolTab] = useState('all');

  // Bộ lọc thời gian chung duy nhất cho toàn Dashboard
  const [timeframe, setTimeframe] = useState('all');

  // Cấu hình phân trang
  const [toolsPerPage, setToolsPerPage] = useState(20);
  const [toolsPage, setToolsPage] = useState(1);
  const [leadsPerPage, setLeadsPerPage] = useState(20);
  const [leadsPage, setLeadsPage] = useState(1);

  const fetchAllData = async () => {
    try {
      const [dashRes, leadsRes] = await Promise.all([
        fetch(`${API_URL}/dashboard`),
        fetch(`${API_URL}/leads`)
      ]);
      if (dashRes.ok) setData(await dashRes.json());
      if (leadsRes.ok) setLeads(await leadsRes.json());
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleDeleteLead = async (id) => {
    if (!window.confirm('Delete this lead entry permanently?')) return;
    try {
      const res = await fetch(`${API_URL}/leads/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="skeleton" style={{ height: '40px', width: '200px' }}></div>
        <div style={{ display: 'flex', gap: '20px' }}>
          {[1, 2, 3, 4, 5].map(n => <div key={n} className="skeleton" style={{ height: '120px', flex: 1, borderRadius: '12px' }}></div>)}
        </div>
      </div>
    );
  }

  const { counts, recentTools = [] } = data || {};

  // Hàm helper lọc danh sách theo mốc thời gian
  const filterByTimeframe = (items, dateField, selectedTimeframe) => {
    if (selectedTimeframe === 'all') return items;
    
    const now = new Date();
    // Bắt đầu ngày hôm nay (00:00:00 local time)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
    const sevenDaysAgo = todayStart - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = todayStart - 30 * 24 * 60 * 60 * 1000;

    return items.filter(item => {
      if (!item[dateField]) return false;
      const itemTime = new Date(item[dateField]).getTime();
      
      if (selectedTimeframe === 'today') {
        return itemTime >= todayStart;
      }
      if (selectedTimeframe === 'yesterday') {
        return itemTime >= yesterdayStart && itemTime < todayStart;
      }
      if (selectedTimeframe === '7days') {
        return itemTime >= sevenDaysAgo;
      }
      if (selectedTimeframe === '30days') {
        return itemTime >= thirtyDaysAgo;
      }
      return true;
    });
  };

  // 1. Lọc Tools theo mốc thời gian chung, sau đó lọc theo Tab phân loại
  const timeframeFilteredTools = filterByTimeframe(recentTools, 'created_at', timeframe);
  const filteredTools = timeframeFilteredTools.filter(tool => {
    if (toolTab === 'paid') return tool.is_paid_submission === 1;
    if (toolTab === 'affiliate') return tool.is_paid_submission !== 1;
    return true;
  });

  // Tính toán phân trang cho Tools sau khi lọc
  const totalTools = filteredTools.length;
  const totalToolsPages = Math.ceil(totalTools / toolsPerPage) || 1;
  const currentToolsPage = Math.min(toolsPage, totalToolsPages);
  const indexOfLastTool = currentToolsPage * toolsPerPage;
  const indexOfFirstTool = indexOfLastTool - toolsPerPage;
  const paginatedTools = filteredTools.slice(indexOfFirstTool, indexOfLastTool);

  // 2. Lọc Leads theo mốc thời gian chung (Gộp chung không chia tab)
  const filteredLeads = filterByTimeframe(leads, 'created_at', timeframe);
  
  // Tính toán phân trang cho Leads sau khi lọc
  const totalLeads = filteredLeads.length;
  const totalLeadsPages = Math.ceil(totalLeads / leadsPerPage) || 1;
  const currentLeadsPage = Math.min(leadsPage, totalLeadsPages);
  const indexOfLastLead = currentLeadsPage * leadsPerPage;
  const indexOfFirstLead = indexOfLastLead - leadsPerPage;
  const paginatedLeads = filteredLeads.slice(indexOfFirstLead, indexOfLastLead);

  // Component UI phụ trợ chọn số dòng hiển thị
  const PageSelector = ({ itemsPerPage, setItemsPerPage, setPage }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
      <span>Show:</span>
      <select 
        value={itemsPerPage} 
        onChange={(e) => {
          setItemsPerPage(Number(e.target.value));
          setPage(1);
        }}
        style={{
          padding: '3px 8px',
          borderRadius: '6px',
          border: '1px solid var(--border)',
          background: 'var(--bg-sidebar)',
          color: 'var(--text-primary)',
          fontSize: '12px',
          outline: 'none',
          cursor: 'pointer'
        }}
      >
        <option value={20}>20</option>
        <option value={50}>50</option>
        <option value={100}>100</option>
      </select>
    </div>
  );

  // Component UI chọn mốc thời gian lọc (Giao diện Premium hơn)
  const TimeframeSelector = ({ value, onChange }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
      <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Period:</span>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: '6px 14px',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          background: 'var(--bg-sidebar)',
          color: 'var(--text-primary)',
          fontSize: '13px',
          fontWeight: '600',
          outline: 'none',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
        }}
      >
        <option value="all">All Time</option>
        <option value="today">Today</option>
        <option value="yesterday">Yesterday</option>
        <option value="7days">Last 7 Days</option>
        <option value="30days">Last 30 Days</option>
      </select>
    </div>
  );

  const PaginationControls = ({ currentPage, totalPages, setPage }) => {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px', 
        marginTop: '16px', 
        justifyContent: 'space-between',
        height: '32px',
        visibility: totalPages <= 1 ? 'hidden' : 'visible'
      }}>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
        </span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            onClick={() => setPage(p => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="btn btn-secondary btn-sm"
            style={{ padding: '4px 10px', fontSize: '12px', height: 'auto' }}
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => setPage(p => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="btn btn-secondary btn-sm"
            style={{ padding: '4px 10px', fontSize: '12px', height: 'auto' }}
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', width: '100%' }}>
      <div className="crm-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '28px' }}>CRM Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome to NexToolX administration control room.</p>
        </div>
        <TimeframeSelector value={timeframe} onChange={(val) => { setTimeframe(val); setToolsPage(1); setLeadsPage(1); }} />
      </div>

      {/* Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <h3>Total AI Tools</h3>
          <div className="value">{counts?.tools || 0}</div>
        </div>
        
        <div className="metric-card" style={{ borderLeft: '4px solid var(--accent-amber)', background: counts?.pendingTools > 0 ? 'rgba(245,158,11,0.04)' : '' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            Pending Approval {counts?.pendingTools > 0 && <Bell size={12} style={{ color: 'var(--accent-amber)', animation: 'pulse 1s infinite' }} />}
          </h3>
          <div className="value" style={{ color: counts?.pendingTools > 0 ? 'var(--accent-amber)' : '' }}>
            {counts?.pendingTools || 0}
          </div>
        </div>

        <div className="metric-card" style={{ borderLeft: '4px solid var(--accent-purple)' }}>
          <h3>Categories</h3>
          <div className="value">{counts?.categories || 0}</div>
        </div>

        <div className="metric-card" style={{ borderLeft: '4px solid #10b981' }}>
          <h3>Deals Active</h3>
          <div className="value">{counts?.deals || 0}</div>
        </div>

        <div className="metric-card" style={{ borderLeft: '4px solid var(--accent-rose)' }}>
          <h3>Registered Leads</h3>
          <div className="value">{counts?.leads || 0}</div>
        </div>
      </div>

      {/* Bố cục chia hai cột ngang cân đối chiều cao */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', 
        gap: '32px', 
        width: '100%',
        alignItems: 'stretch'
      }}>
        
        {/* CỘT 1: Danh sách Công cụ mới & Trạng thái Đơn hàng */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={18} style={{ color: 'var(--primary)' }} /> Tool Submissions ({totalTools})
            </h2>
            <PageSelector itemsPerPage={toolsPerPage} setItemsPerPage={setToolsPerPage} setPage={setToolsPage} />
          </div>

          {/* Bộ chọn Tab phân loại công cụ */}
          <div style={{
            display: 'flex',
            gap: '16px',
            borderBottom: '1px solid var(--border)',
            marginBottom: '16px',
          }}>
            <button
              type="button"
              onClick={() => { setToolTab('all'); setToolsPage(1); }}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: toolTab === 'all' ? '2.5px solid #10b981' : '2.5px solid transparent',
                color: toolTab === 'all' ? '#111827' : 'var(--text-muted)',
                padding: '8px 12px',
                fontSize: '13px',
                fontWeight: toolTab === 'all' ? '750' : '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>All ({timeframeFilteredTools.length})</span>
            </button>
            
            <button
              type="button"
              onClick={() => { setToolTab('paid'); setToolsPage(1); }}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: toolTab === 'paid' ? '2.5px solid #10b981' : '2.5px solid transparent',
                color: toolTab === 'paid' ? '#111827' : 'var(--text-muted)',
                padding: '8px 12px',
                fontSize: '13px',
                fontWeight: toolTab === 'paid' ? '750' : '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>Paid ({timeframeFilteredTools.filter(t => t.is_paid_submission === 1).length})</span>
            </button>

            <button
              type="button"
              onClick={() => { setToolTab('affiliate'); setToolsPage(1); }}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: toolTab === 'affiliate' ? '2.5px solid #10b981' : '2.5px solid transparent',
                color: toolTab === 'affiliate' ? '#111827' : 'var(--text-muted)',
                padding: '8px 12px',
                fontSize: '13px',
                fontWeight: toolTab === 'affiliate' ? '750' : '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>Affiliate ({timeframeFilteredTools.filter(t => t.is_paid_submission !== 1).length})</span>
            </button>
          </div>
          
          <div className="table-container" style={{ width: '100%', overflowX: 'auto', height: '480px', overflowY: 'auto' }}>
            {paginatedTools.length > 0 ? (
              <table className="crm-table" style={{ width: '100%', tableLayout: 'fixed' }}>
                <thead>
                  <tr>
                    <th style={{ width: '20%' }}>Tool Name</th>
                    <th style={{ width: '13%' }}>Type</th>
                    <th style={{ width: '22%' }}>Target Link</th>
                    <th style={{ width: '12%' }}>Pricing</th>
                    <th style={{ width: '11%' }}>Created</th>
                    <th style={{ width: '10%' }}>Status</th>
                    <th style={{ textAlign: 'right', width: '12%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTools.map(tool => (
                    <tr key={tool.id}>
                      <td style={{ fontWeight: '600', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tool.name}</td>
                      <td>
                        {tool.is_paid_submission === 1 ? (
                          <span style={{ 
                            fontSize: '10px', 
                            fontWeight: '700', 
                            color: '#065f46', 
                            background: '#d1fae5', 
                            padding: '3px 6px', 
                            borderRadius: '10px',
                            whiteSpace: 'nowrap',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            {tool.featured === 1 ? (
                              <>
                                <Award size={10} style={{ flexShrink: 0 }} />
                                <span>Featured</span>
                              </>
                            ) : (
                              <>
                                <Zap size={10} style={{ flexShrink: 0 }} />
                                <span>Fast</span>
                              </>
                            )}
                          </span>
                        ) : (
                          <span style={{ 
                            fontSize: '10px', 
                            fontWeight: '600', 
                            color: '#374151', 
                            background: '#f3f4f6', 
                            padding: '3px 6px', 
                            borderRadius: '10px',
                            whiteSpace: 'nowrap',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <Link2 size={10} style={{ flexShrink: 0 }} />
                            <span>Affiliate</span>
                          </span>
                        )}
                      </td>
                      <td>
                        {tool.affiliate_url || tool.website_url ? (
                          <a 
                            href={tool.affiliate_url || tool.website_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            title={tool.affiliate_url || tool.website_url}
                            style={{ 
                              color: 'var(--primary)', 
                              textDecoration: 'none', 
                              fontWeight: '600',
                              fontSize: '11px',
                              maxWidth: '120px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            <Link2 size={11} style={{ flexShrink: 0, color: '#10b981' }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {tool.affiliate_url || tool.website_url}
                            </span>
                          </a>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td>{tool.pricing_type}</td>
                      <td style={{ fontSize: '12px' }}>{new Date(tool.created_at).toLocaleDateString()}</td>
                      <td>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          textTransform: 'capitalize',
                          background: tool.status === 'approved' 
                            ? 'rgba(16, 185, 129, 0.15)' 
                            : tool.status === 'pending'
                            ? 'rgba(245, 158, 11, 0.15)'
                            : 'rgba(239, 68, 68, 0.15)',
                          color: tool.status === 'approved' 
                            ? '#10b981' 
                            : tool.status === 'pending'
                            ? '#f59e0b'
                            : '#ef4444'
                        }}>
                          {tool.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link 
                          to="/tools" 
                          className="btn btn-secondary btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', textDecoration: 'none', padding: '3px 8px' }}
                        >
                          <Edit size={10} />
                          <span>Manage</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No entries found in this list.
              </div>
            )}
          </div>
          <PaginationControls currentPage={currentToolsPage} totalPages={totalToolsPages} setPage={setToolsPage} />
        </div>

        {/* CỘT 2: Registered Customers & Newsletter Subscribers */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} /> Registered Customers ({totalLeads})
            </h2>
            <PageSelector itemsPerPage={leadsPerPage} setItemsPerPage={setLeadsPerPage} setPage={setLeadsPage} />
          </div>

          {/* Bộ chọn Tab tĩnh để cân đối thiết kế */}
          <div style={{
            display: 'flex',
            gap: '16px',
            borderBottom: '1px solid var(--border)',
            marginBottom: '16px',
          }}>
            <div style={{
              background: 'transparent',
              border: 'none',
              borderBottom: '2.5px solid #10b981',
              color: '#111827',
              padding: '8px 12px',
              fontSize: '13px',
              fontWeight: '750',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span>All Customers</span>
            </div>
          </div>

          <div className="table-container" style={{ width: '100%', overflowX: 'auto', flex: 1, height: '480px', overflowY: 'auto' }}>
            {paginatedLeads.length > 0 ? (
              <table className="crm-table" style={{ width: '100%', tableLayout: 'fixed' }}>
                <thead>
                  <tr>
                    <th style={{ width: '20%' }}>Name</th>
                    <th style={{ width: '30%' }}>Email Address</th>
                    <th style={{ width: '18%' }}>Type</th>
                    <th style={{ width: '18%' }}>Registered At</th>
                    <th style={{ textAlign: 'right', width: '14%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLeads.map(lead => (
                    <tr key={lead.id}>
                      <td style={{ fontWeight: '600', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.name}</td>
                      <td style={{ color: 'var(--primary)', fontWeight: '500', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.email}</td>
                      <td>
                        {lead.lead_type === 'customer' ? (
                          <span style={{ 
                            fontSize: '10px', 
                            fontWeight: '700', 
                            color: '#065f46', 
                            background: '#d1fae5', 
                            padding: '3px 6px', 
                            borderRadius: '10px',
                            whiteSpace: 'nowrap',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <ShoppingBag size={10} style={{ flexShrink: 0 }} />
                            <span>Buyer</span>
                          </span>
                        ) : (
                          <span style={{ 
                            fontSize: '10px', 
                            fontWeight: '600', 
                            color: '#2563eb', 
                            background: '#dbeafe', 
                            padding: '3px 6px', 
                            borderRadius: '10px',
                            whiteSpace: 'nowrap',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <Mail size={10} style={{ flexShrink: 0 }} />
                            <span>Subscriber</span>
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: '12px' }}>{new Date(lead.created_at).toLocaleDateString()}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          onClick={() => handleDeleteLead(lead.id)} 
                          className="btn btn-danger btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', padding: '3px 8px' }}
                        >
                          <Trash size={10} />
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No entries found in this list.
              </div>
            )}
          </div>
          <PaginationControls currentPage={currentLeadsPage} totalPages={totalLeadsPages} setPage={setLeadsPage} />
        </div>

      </div>
    </div>
  );
}

export default Dashboard;
