import React, { Suspense, useState } from 'react';
import { IconCheck, IconEye, IconEyeOff, IconPlayerPlay, IconPlayerStop, IconRotate } from '@tabler/icons-react';
import { Badge, Button, Card, Skeleton } from '@/components/ui';
import { TopicExercise } from '@/lib/types';
import { pyodideClient } from '@/lib/pyodideClient';
import { CodeBlock, SafeMarkdown } from './RichContent';

const CodeEditor = React.lazy(() => import('@/features/playground/CodeEditor'));

export function ExerciseRunner({ exercise }: { exercise: TopicExercise }) {
  const isPython = (exercise.language || 'python').toLowerCase().includes('py');
  const [code, setCode] = useState(exercise.starterCode || '');
  const [running, setRunning] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [stdout, setStdout] = useState('');
  const [stderr, setStderr] = useState('');
  const [passed, setPassed] = useState<boolean | null>(null);
  const [showSolution, setShowSolution] = useState(false);

  const handleRun = async () => {
    if (!isPython || running) return;
    setRunning(true);
    setStdout('');
    setStderr('');
    setPassed(null);

    try {
      const res = await pyodideClient.run(code, {
        onStatus: (_phase, msg) => setStatusMsg(msg),
        onStdout: (chunk) => setStdout((s) => s + chunk),
        onStderr: (chunk) => setStderr((s) => s + chunk),
      });
      setStatusMsg('');
      if (exercise.expectedOutput) {
        setPassed(res.ok && res.stdout.trim().includes(exercise.expectedOutput.trim()));
      } else {
        setPassed(res.ok);
      }
    } catch (err) {
      setStderr(err instanceof Error ? err.message : String(err));
      setPassed(false);
    } finally {
      setRunning(false);
      setStatusMsg('');
    }
  };

  const handleStop = () => {
    pyodideClient.stop();
    setRunning(false);
    setStatusMsg('Stopped');
  };

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Badge variant="gold">Coding Exercise ({exercise.language || 'Python'})</Badge>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={<IconRotate size={14} />}
            onClick={() => setCode(exercise.starterCode || '')}
          >
            Reset
          </Button>
          {exercise.solution && (
            <Button
              variant="ghost"
              size="sm"
              icon={showSolution ? <IconEyeOff size={14} /> : <IconEye size={14} />}
              onClick={() => setShowSolution((s) => !s)}
            >
              {showSolution ? 'Hide Solution' : 'Show Solution'}
            </Button>
          )}
        </div>
      </div>

      <SafeMarkdown content={exercise.instructions} />

      {exercise.expectedOutput && (
        <div className="p-3 rounded-[var(--radius-sm)] bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-[12.5px]">
          <span className="font-bold uppercase tracking-wider text-[11px] text-[var(--text-tertiary)]">
            Target output:
          </span>
          <pre className="mt-1 font-mono text-[var(--text-primary)] whitespace-pre-wrap m-0">
            {exercise.expectedOutput}
          </pre>
        </div>
      )}

      {isPython ? (
        <>
          <div className="h-[240px]">
            <Suspense fallback={<Skeleton className="h-full w-full" />}>
              <CodeEditor value={code} language="python" onChange={setCode} onRun={handleRun} />
            </Suspense>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              onClick={handleRun}
              loading={running}
              icon={<IconPlayerPlay size={15} />}
            >
              {running ? statusMsg || 'Running...' : 'Run Python'}
            </Button>
            {running && (
              <Button variant="danger" size="sm" icon={<IconPlayerStop size={15} />} onClick={handleStop}>
                Stop
              </Button>
            )}
            {passed === true && (
              <Badge variant="success">
                <IconCheck size={13} /> Output matched!
              </Badge>
            )}
            {passed === false && <Badge variant="danger">Check output & try again</Badge>}
          </div>

          {(stdout || stderr) && (
            <div className="rounded-[var(--radius-md)] bg-[#0E0E1A] text-[#F4F2EC] p-3.5 font-mono text-[13px] max-h-[180px] overflow-y-auto">
              {stdout && <pre className="m-0 whitespace-pre-wrap">{stdout}</pre>}
              {stderr && <pre className="m-0 whitespace-pre-wrap text-[#F87171]">{stderr}</pre>}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-2">
          <CodeBlock code={exercise.starterCode} language={exercise.language} />
          <p className="text-[12.5px] text-[var(--text-tertiary)]">
            In-lesson execution is currently supported for Python. Use the Code Playground for Web
            exercises.
          </p>
        </div>
      )}

      {showSolution && exercise.solution && (
        <div>
          <div className="text-[12px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-1">
            Reference Solution
          </div>
          <CodeBlock code={exercise.solution} language={exercise.language} />
        </div>
      )}
    </Card>
  );
}
