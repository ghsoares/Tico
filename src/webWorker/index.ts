export default function createWorker() {
	return new Worker('./webWorker.ts');
}