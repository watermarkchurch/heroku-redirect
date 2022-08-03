import { fork, ChildProcess } from 'child_process'
import fetch from 'node-fetch'

describe('web', () => {
  let child: ChildProcess

  afterEach((done) => {
    child.kill()
    child.on('exit', function() {
      done()
    })
  })

  it('redirects to base URL', async () => {
    await forkIt()

    const resp = await fetch('http://localhost:5000/test', {
      redirect: 'manual'
    })

    expect(resp.status).toEqual(301)
    expect(resp.headers.get('Location')).toEqual('https://www.watermark.org/test')
  })

  it('redirects to base URL with status code', async () => {
    await forkIt({
      REDIRECT_STATUS: '302'
    })

    const resp = await fetch('http://localhost:5000/test', {
      redirect: 'manual'
    })

    expect(resp.status).toEqual(302)
    expect(resp.headers.get('Location')).toEqual('https://www.watermark.org/test')
  })

  it('redirects to matched URL with status', async () => {
    await forkIt({
      REDIRECT_STATUS: '302',
      RULE_1: '* https://www.watermark.org/frisco 301'
    })

    const resp = await fetch('http://localhost:5000/test', {
      redirect: 'manual'
    })

    expect(resp.status).toEqual(301)
    expect(resp.headers.get('Location')).toEqual('https://www.watermark.org/frisco')
  })

  it('redirects match by hostname', async () => {
    await forkIt({
      RULE_1: 'https?://wmfw.org/* https://www.watermark.org/fort-worth 302',
      RULE_2: 'https?://www.watermarkfrisco.org/* https://www.watermark.org/frisco',
    })

    const resp = await fetch('http://localhost:5000/test', {
      headers: {
        host: 'wmfw.org'
      },
      redirect: 'manual'
    })

    expect(resp.headers.get('Location')).toEqual('https://www.watermark.org/fort-worth')
    expect(resp.status).toEqual(302)

    const resp2 = await fetch('http://localhost:5000', {
      headers: {
        host: 'www.watermarkfrisco.org'
      },
      redirect: 'manual'
    })

    expect(resp2.headers.get('Location')).toEqual('https://www.watermark.org/frisco')
    expect(resp2.status).toEqual(301)
  })

  it('rules ordered by name', async () => {
    await forkIt({
      RULE_2: '* https://www.watermark.org/frisco',
      RULE_1: 'https?://wmfw.org/* https://www.watermark.org/fort-worth',
    })

    const resp = await fetch('http://localhost:5000/test', {
      headers: {
        host: 'wmfw.org'
      },
      redirect: 'manual'
    })

    expect(resp.headers.get('Location')).toEqual('https://www.watermark.org/fort-worth')
  })

  it('rules ordered by name numerically', async () => {
    await forkIt({
      RULE_2: '* https://www.watermark.org/frisco',
      RULE_10: 'https?://wmfw.org/* https://www.watermark.org/fort-worth',
    })

    const resp = await fetch('http://localhost:5000/test', {
      headers: {
        host: 'wmfw.org'
      },
      redirect: 'manual'
    })

    expect(resp.headers.get('Location')).toEqual('https://www.watermark.org/frisco')
  })

  it('redirects match preserving path and query', async () => {
    await forkIt({
      RULE_1: 'https?://wmfw.org/* https://www.watermark.org/fort-worth 302 preserve',
      RULE_2: 'https?://watermarkfw.org/* https://www.watermarkfortworth.org 301 preserve',
    })

    const { location } = await doFetch('https://wmfw.org/test/a/b?q=some-search')

    expect(location).toEqual('https://www.watermark.org/fort-worth/test/a/b?q=some-search')

    const resp2 = await fetch('http://localhost:5000/test/a/b?q=some-search', {
      headers: {
        host: 'watermarkfw.org'
      },
      redirect: 'manual'
    })

    expect(resp2.headers.get('Location')).toEqual('https://www.watermarkfortworth.org/test/a/b?q=some-search')
  })

  async function doFetch(url: string): Promise<{ location: string, status: number }> {
    const parsed = new URL(url)
    const resp = await fetch(`http://localhost:5000${parsed.pathname}${parsed.search}`, {
      headers: {
        host: parsed.host,
      },
      redirect: 'manual'
    })

    expect(resp.status).toBeLessThan(400)
    expect(resp.status).toBeGreaterThan(299)

    return {
      location: resp.headers.get('Location')!,
      status: resp.status
    }
  }

  function forkIt(env?: { [key: string]: string }): Promise<void> {
    child = fork('./web', [], {
      env: {
        NEW_BASE_URL: 'https://www.watermark.org',
        ...env
      }
    })

    return new Promise((resolve) => {
      child.once('message', () => {
        resolve()
      })
    })
  }
})