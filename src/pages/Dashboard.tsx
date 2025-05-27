import { Card } from 'antd';
import { useEffect, useState } from 'react';
import axios from 'axios';
import API_BASE_URL from '../apiConfig';


interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  publishedAt: string;
  excerpt?: string;
}

interface Author {
  id: number;
  name: string;
  slug: string;
  bio: string;
  blog_posts: BlogPost[];
  user: { username: string; email: string };
  profile_pic_url?: string | null;
  documentId?: string; // Add documentId here
}


export default function Dashboard() {
  // Responsive styles for dashboard
  const dashboardResponsiveStyle = `
    @media (max-width: 900px) {
      .qm-dashboard-banner {
        flex-direction: column !important;
        padding: 24px 10px !important;
        min-height: 120px !important;
        gap: 18px !important;
      }
      .qm-dashboard-banner .qm-banner-left {
        max-width: 100% !important;
        min-width: 0 !important;
      }
      .qm-dashboard-banner .qm-banner-right {
        margin-left: 0 !important;
        margin-top: 18px !important;
        justify-content: center !important;
      }
      .qm-dashboard-stats-row {
        flex-direction: column !important;
        gap: 16px !important;
      }
    }
    @media (max-width: 600px) {
      .qm-dashboard-banner {
        padding: 12px 2vw !important;
        min-height: 80px !important;
      }
      .qm-dashboard-banner .qm-banner-left > div:first-child {
        font-size: 20px !important;
      }
      .qm-dashboard-banner .qm-banner-right img {
        height: 80px !important;
        width: 80px !important;
      }
      .qm-dashboard-stats-row > div {
        min-height: 60px !important;
      }
      .qm-dashboard-recent-card .ant-card-body {
        padding: 8px 2vw !important;
      }
    }
  `;
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0, // This will be set from QualMinds API
    published: 0,
    drafts: 0,
    modified: 0,
    authors: 0,
  });
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);

  // Get logged-in email from localStorage (set as username after login)
  const email = localStorage.getItem('username');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        // 1. Fetch total posts from QualMinds (all posts)
        let totalPosts = 0;
        try {
          const totalRes = await axios.get(`${API_BASE_URL}/blog-posts?pagination[page]=1&pagination[pageSize]=1`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          totalPosts = totalRes.data?.meta?.pagination?.total || 0;
        } catch (err) {
          // fallback: leave totalPosts as 0
        }

        // 2. Fetch author/user-specific data as before
        if (!email) {
          setLoading(false);
          setStats(prev => ({ ...prev, total: totalPosts }));
          return;
        }
        const res = await axios.get(
          `${API_BASE_URL}/authors?populate=*&filters[user][email][$eq]=${encodeURIComponent(email)}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );
        const authorsData: Author[] = res.data.data || [];
        setAuthors(authorsData);
        // There should be only one author for the logged-in user
        const currentAuthor = authorsData[0];
        // Use the correct author documentId for API param
        const authorDocumentId = currentAuthor?.documentId;
        let allPosts: any[] = [];
        let publishedPosts: any[] = [];
        let draftPosts: any[] = [];
        if (authorDocumentId) {
          // Fetch both published and draft posts for this author using documentId
          const [publishedRes, draftRes] = await Promise.all([
            axios.get(`${API_BASE_URL}/blog-posts?populate=authors&status=published&filters[authors][documentId][$eq]=${authorDocumentId}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
            axios.get(`${API_BASE_URL}/blog-posts?populate=authors&status=draft&filters[authors][documentId][$eq]=${authorDocumentId}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
          ]);
          publishedPosts = publishedRes.data.data || [];
          draftPosts = draftRes.data.data || [];
          allPosts = [...publishedPosts, ...draftPosts];
        }
        // Count unique documentIds
        const docIdCounts: { [docId: string]: number } = {};
        allPosts.forEach((p: any) => {
          if (p.documentId) {
            docIdCounts[p.documentId] = (docIdCounts[p.documentId] || 0) + 1;
          }
        });
        // Drafts: unique documentId, publishedAt is null
        const draftCount = allPosts.filter(
          (p: any) => docIdCounts[p.documentId] === 1 && !p.publishedAt
        ).length;

        // Modified: For each documentId in both published and draft posts,
        // count the number of draft posts where updatedAt > publishedAt and publishedAt is null
        // (Assume updatedAt and publishedAt are ISO strings)
        let modifiedCount = 0;
        // Build maps for quick lookup
        const publishedByDocId: { [docId: string]: any } = {};
        publishedPosts.forEach((p: any) => {
          if (p.documentId) publishedByDocId[p.documentId] = p;
        });
        draftPosts.forEach((draft: any) => {
          const docId = draft.documentId;
          if (
            docId &&
            publishedByDocId[docId] &&
            draft.publishedAt == null &&
            draft.updatedAt &&
            publishedByDocId[docId].publishedAt &&
            new Date(draft.updatedAt) > new Date(publishedByDocId[docId].publishedAt)
          ) {
            modifiedCount++;
          }
        });

        // For published count, use the number of published posts from author API's blog_posts
        let publishedCount = 0;
        if (currentAuthor && Array.isArray(currentAuthor.blog_posts)) {
          publishedCount = currentAuthor.blog_posts.filter((p: any) => p.publishedAt).length;
        }
        setStats({
          total: totalPosts, // Use QualMinds total
          published: publishedCount,
          drafts: draftCount,
          modified: modifiedCount,
          authors: currentAuthor ? 1 : 0,
        });
        // For recently published section, use only the blog_posts from the author API
        // Filter for published posts (publishedAt not null), sort by publishedAt desc, take 5
        let recentPublished: any[] = [];
        if (currentAuthor && Array.isArray(currentAuthor.blog_posts)) {
          recentPublished = currentAuthor.blog_posts
            .filter((p: any) => p.publishedAt)
            .sort((a: any, b: any) => (b.publishedAt || '').localeCompare(a.publishedAt || ''))
            .slice(0, 5);
        }
        setRecentPosts(recentPublished);
      } catch (e) {
        // handle error
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [email]);

  // Get author name for greeting (fallback to username/email)
  const authorName = (authors[0]?.name || email || 'User');

  return (
    <>
      <style>{dashboardResponsiveStyle}</style>
      {/* Modern Welcome Banner */}
      <div className="qm-dashboard-banner" style={{
        background: 'linear-gradient(90deg, #e0edfa 0%, #c7e0fa 100%)',
        borderRadius: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '32px 40px',
        marginBottom: 32,
        minHeight: 180,
        boxShadow: '0 2px 12px 0 rgba(0,0,0,0.06)',
        position: 'relative',
        overflow: 'hidden',
        width: '100%'
      }}>
        <div className="qm-banner-left" style={{ flex: '0 1 80%', minWidth: 220, maxWidth: '80%' }}>
          <div style={{ display: 'flex', alignItems: 'center', fontWeight: 700, fontSize: 30, color: '#222', marginBottom: 12, wordBreak: 'break-word' }}>
            <span>Hello {authorName}!</span>
            <span
              title="Edit Profile"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                marginLeft: 16,
                cursor: 'pointer',
                borderRadius: '50%',
                padding: 4,
                transition: 'background 0.2s',
                background: 'transparent',
              }}
              onClick={() => {
                // Go to edit profile page
                if (window.location.hash) {
                  window.location.hash = '#/editprofile';
                } else {
                  const event = new CustomEvent('dashboard-edit-profile');
                  window.dispatchEvent(event);
                }
              }}
              onMouseOver={e => (e.currentTarget.style.background = '#e0edfa')}
              onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
            >
              {/* Pencil/Edit SVG icon */}
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
              </svg>
            </span>
          </div>
          <div style={{ fontSize: 16, color: '#42474e', marginBottom: 32, maxWidth: '90%', wordBreak: 'break-word', lineHeight: 1.6 }}>
            {authors[0]?.bio && authors[0].bio.trim() !== ''
              ? authors[0].bio
              : 'Add your bio to let others know more about you!'}
          </div>
          <button
            style={{
              background: 'linear-gradient(90deg, #2563eb 0%, #1e40af 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '6px 18px',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              boxShadow: '0 1px 4px 0 rgba(37,99,235,0.08)',
              transition: 'background 0.2s',
              marginTop: 8,
            }}
            onClick={() => {
              // Open blank post form (SPA navigation)
              const event = new CustomEvent('dashboard-new-post', { detail: { create: true, blank: true } });
              window.dispatchEvent(event);
            }}
          >
            Write a new post
          </button>
        </div>
        {/* Profile picture or illustration (right) */}
        <div className="qm-banner-right" style={{ flex: '0 1 20%', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', minWidth: 120, maxWidth: '20%' }}>
          {authors[0]?.profile_pic_url ? (
            <img
              src={authors[0].profile_pic_url}
              alt="Profile"
              style={{
                height: 180,
                width: 180,
                objectFit: 'cover',
                borderRadius: '8%',
                border: '4px solid #fff',
                boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)',
                marginLeft: 32,
                background: '#f1f5f9',
              }}
              onError={e => (e.currentTarget.style.display = 'none')}
            />
          ) : (
            <img
              src="https://assets-v2.lottiefiles.com/a/2b2e2e7e-1162-11ee-8e3a-6f7e2b6b7b7b/2b2e2e7e-1162-11ee-8e3a-6f7e2b6b7b7b.png"
              alt="Person at computer illustration"
              style={{ height: 140, width: 'auto', borderRadius: 0, marginLeft: 32 }}
              onError={e => (e.currentTarget.style.display = 'none')}
            />
          )}
        </div>
      </div>
      {/* Stat Labels */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 8, width: '100%' }}>
        <div style={{ flex: 1, textAlign: 'left', fontWeight: 700, fontSize: 15, color: '##222', letterSpacing: 0.5, paddingLeft: 2 }}>
          Total QualMinds Posts
        </div>
        <div style={{ flex: 3, textAlign: 'left', fontWeight: 700, fontSize: 15, color: '#222', letterSpacing: 0.5, paddingLeft: 2 }}>
          Your Contribution
        </div>
      </div>
      <div className="qm-dashboard-stats-row" style={{ display: 'flex', gap: 24, marginBottom: 32, width: '100%' }}>
        {/* (Total Posts) - QualMinds */}
        <div style={{ flex: 1, display: 'flex', minHeight: 90, borderRadius: 8, boxShadow: '0 1px 4px #e0e0e0', background: 'linear-gradient(90deg, #2563eb 0%, #1e40af 100%)', overflow: 'hidden' }}>
          <div style={{ flex: '0 0 20%', background: 'linear-gradient(135deg, #2563eb 0%, #1e88e5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
          </div>
          <div style={{ flex: '1 1 80%', background: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '18px 0 18px 18px' }}>
            <div style={{ color: '#222', fontWeight: 600, fontSize: 13, letterSpacing: 1 }}>TOTAL POSTS</div>
            <div style={{ color: '#222', fontWeight: 700, fontSize: 22, marginTop: 2 }}>{stats.total}</div>
          </div>
        </div>
        {/* Published - Your Contribution */}
        <div style={{ flex: 1, display: 'flex', minHeight: 90, borderRadius: 8, boxShadow: '0 1px 4px #e0e0e0', background: 'linear-gradient(90deg, #1e88e5 0%, #2563eb 100%)', overflow: 'hidden' }}>
          <div style={{ flex: '0 0 20%', background: 'linear-gradient(135deg, #2563eb 0%, #1e88e5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 12l2 2 4-4" /></svg>
          </div>
          <div style={{ flex: '1 1 80%', background: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '18px 0 18px 18px' }}>
            <div style={{ color: '#222', fontWeight: 600, fontSize: 13, letterSpacing: 1 }}>PUBLISHED</div>
            <div style={{ color: '#222', fontWeight: 700, fontSize: 22, marginTop: 2 }}>{stats.published}</div>
          </div>
        </div>
        {/* Drafts - Your Contribution */}
        <div style={{ flex: 1, display: 'flex', minHeight: 90, borderRadius: 8, boxShadow: '0 1px 4px #e0e0e0', background: 'linear-gradient(90deg, #22c55e 0%, #15803d 100%)', overflow: 'hidden' }}>
          <div style={{ flex: '0 0 20%', background: 'linear-gradient(135deg, #2563eb 0%, #1e88e5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /></svg>
          </div>
          <div style={{ flex: '1 1 80%', background: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '18px 0 18px 18px' }}>
            <div style={{ color: '#222', fontWeight: 600, fontSize: 13, letterSpacing: 1 }}>DRAFTS</div>
            <div style={{ color: '#222', fontWeight: 700, fontSize: 22, marginTop: 2 }}>{stats.drafts}</div>
          </div>
        </div>
        {/* Modified - Your Contribution */}
        <div style={{ flex: 1, display: 'flex', minHeight: 90, borderRadius: 8, boxShadow: '0 1px 4px #e0e0e0', background: 'linear-gradient(90deg, #f59e42 0%, #e65100 100%)', overflow: 'hidden' }}>
          <div style={{ flex: '0 0 20%', background: 'linear-gradient(135deg, #2563eb 0%, #1e88e5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>
          </div>
          <div style={{ flex: '1 1 80%', background: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '18px 0 18px 18px' }}>
            <div style={{ color: '#222', fontWeight: 600, fontSize: 13, letterSpacing: 1 }}>MODIFIED</div>
            <div style={{ color: '#222', fontWeight: 700, fontSize: 22, marginTop: 2 }}>{stats.modified}</div>
          </div>
        </div>
      </div>
      <Card className="qm-dashboard-recent-card" title={<span style={{ fontWeight: 600 }}>Recently Published</span>} loading={loading} variant="borderless" style={{ marginTop: 24, boxShadow: '0 1px 4px #e0e0e0', width: '100%', minHeight: 480 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, padding: '8px 0', minHeight: 220 }}>
          {(recentPosts.length > 0 ? recentPosts : [{ id: 0, title: 'Demo Post', slug: '', content: '', publishedAt: '', excerpt: '' }]).map((item, idx) => (
            <div
              key={item.id || idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                background: 'linear-gradient(90deg,rgb(249, 250, 251) 0%, #fff 100%)',
                borderRadius: 12,
                padding: '18px 24px',
                minHeight: 64,
                transition: 'box-shadow 0.2s',
                gap: 18,
                position: 'relative',
                cursor: 'pointer',
              }}
              onMouseOver={e => (e.currentTarget.style.boxShadow = '0 4px 16px #b6d0f7')}
              onMouseOut={e => (e.currentTarget.style.boxShadow = '0 1px 4px #e0e0e0')}
              onClick={() => {
                // SPA navigation to posts list page (emit event for App handler)
                const event = new CustomEvent('dashboard-goto-posts');
                window.dispatchEvent(event);
              }}
            >
              {/* Icon/Avatar */}
              <div style={{
                flex: '0 0 48px',
                height: 48,
                width: 48,
                background: 'linear-gradient(135deg, #2563eb 0%, #1e88e5 100%)',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 18,
                boxShadow: '0 2px 8px #e0e0e0',
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="4" /><path d="M7 8h10M7 12h6M7 16h8" /></svg>
              </div>
              {/* Post Info */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontWeight: 600, fontSize: 17, color: '#222', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
                <div style={{ color: '#888', fontSize: 13, marginTop: 2 }}>
                  {`Published: ${item.publishedAt ?
                    new Date(item.publishedAt).toLocaleString('en-IN', {
                      timeZone: 'Asia/Kolkata',
                      year: 'numeric',
                      month: 'short',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })
                    : 'N/A'}`}
                </div>
                {/* Categories and Tags reverted: no display */}
                {item.excerpt && (
                  <div style={{ color: '#444', fontSize: 14, marginTop: 8, lineHeight: 1.5, opacity: 0.85, maxHeight: 48, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.excerpt}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
