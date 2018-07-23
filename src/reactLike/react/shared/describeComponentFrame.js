export default function describeComponentFrame(name, source, ownerName) {
  return `\n in${name || 'unknown'} ${
    source
      ? `(at${source.fileName.replace(/^.*[\\/]/, '')}:${source.lineNumber})`
      : `${ownerName ? `(created by${ownerName})` : ''}`
  }`;
}
