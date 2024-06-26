import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

import styles from '../styles/Login.module.css';

import { useRouter } from 'next/router';

const ServerSelect = dynamic(
  () =>
    import('@/components/PageComponents/Auth/ServerSelect').then(
      (mod) => mod.default
    ),
  { ssr: false }
);

const LoginButton = dynamic(
  () =>
    import('@/components/PageComponents/Auth/LoginButton').then(
      (mod) => mod.default
    ),
  { ssr: false }
);

const LoginInput = dynamic(
  () =>
    import('@/components/PageComponents/Auth/LoginInput').then(
      (mod) => mod.default
    ),
  { ssr: false }
);

import { ServerList } from '@/types';
import { HiLightningBolt } from 'react-icons/hi';

export default function Login() {
  const router = useRouter();
  const [uid, setUid] = useState('');
  const [pass, setPass] = useState('');

  const [error, setError] = useState(0);

  const [server, setServers] = useState<ServerList>('');

  function save() {
    setError(-1);
    if (uid.length !== 12) return setError(1);
    fetch('/api/login?server=' + server, {
      method: 'POST',
      cache: 'force-cache',
      headers: {
        Authorization: `Basic ${btoa(uid)}`,
      },
      body: JSON.stringify({
        user: uid,
        pass: pass,
      }),
    })
      .then((d) => d.json())
      .then(
        (
          a:
            | { Status: 1; msg: string }
            | { Status: 0; success: boolean; token: string }
        ) => {
          if (a.Status === 1) {
            setError(2);
            localStorage.setItem('server', server);
            localStorage.setItem('userid', uid);
            router.push('/course');
          } else if (a.Status === 0) {
            setError(1);
          }
        }
      );
  }

  useEffect(() => {
    const no = localStorage.getItem('userid');
    if (no) router.push('/course');

    const sr = localStorage.getItem('server');
    if (sr) setServers(sr as ServerList);
  }, []);

  useEffect(() => {
    fetch('/api/status?server=' + (server || 'ktretelab2023'))
      .then((d) => d.json())
      .then((a) => {
        if (!a || a.Status !== 1) router.push('/offline');
      });
  }, [server]);

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        {ServerSelect && LoginInput && LoginButton ? (
          <div className={styles.login}>
            <div className={styles.lefty}>
              <div className={styles.titles}>
                <div className={styles.name}>
                  <h1>Better-Lab</h1>
                  <HiLightningBolt />
                </div>
                <p>
                  A better alternative to SRM-Elab. Efficient, Fast, Zippy as
                  hecc
                </p>
              </div>
              <button onClick={() => router.push('/academia')}>Academia</button>
            </div>

            <div className={styles.inputs}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <LoginInput
                  onChange={(e) => {
                    setError(0);
                    setUid(e.target.value);
                  }}
                  error={error}
                  uid={uid}
                  type="UID"
                />
                <LoginInput
                  onChange={(e) => {
                    setError(0);
                    setPass(e.target.value);
                  }}
                  error={error}
                  uid={pass}
                  type="Password"
                />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <ServerSelect server={server} setServers={setServers} />
                <LoginButton error={error} onClick={save} />
              </div>
            </div>
            <p className={styles.credits}>
              Made by <a href="https://marban.is-a.dev">Marban</a> and{' '}
              <a href="https://www.linkedin.com/in/srivishal-sivasubramanian-1a09b9240/">
                root-daemon
              </a>
            </p>
          </div>
        ) : (
          <div className={styles.login}>
            <h3 style={{ margin: 0 }} className="loader-text">
              Loading..
            </h3>
          </div>
        )}
      </div>
    </main>
  );
}
