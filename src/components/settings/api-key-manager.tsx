'use client';

import { AlertCircle, Check, Eye, EyeOff, Plus, TestTube, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';

interface ApiKey {
	id: string;
	provider: 'GOOGLE' | 'OPENAI' | 'ANTHROPIC' | 'HUGGINGFACE';
	keyName?: string;
	maskedKey: string;
	isActive: boolean;
	lastUsed?: string;
	createdAt: string;
}

interface ApiKeyFormData {
	provider: 'GOOGLE' | 'OPENAI' | 'ANTHROPIC' | 'HUGGINGFACE';
	apiKey: string;
	keyName: string;
}

const PROVIDER_INFO = {
	GOOGLE: {
		name: 'Google Gemini',
		description: 'Free tier: 5 requests/minute, 25 requests/day',
		placeholder: 'AIzaSy...',
		helpUrl: 'https://makersuite.google.com/app/apikey',
		color: 'bg-blue-100 text-blue-800',
	},
	OPENAI: {
		name: 'OpenAI',
		description: 'Pay-per-use pricing',
		placeholder: 'sk-...',
		helpUrl: 'https://platform.openai.com/api-keys',
		color: 'bg-green-100 text-green-800',
	},
	ANTHROPIC: {
		name: 'Anthropic Claude',
		description: 'Pay-per-use pricing',
		placeholder: 'sk-ant-...',
		helpUrl: 'https://console.anthropic.com/',
		color: 'bg-purple-100 text-purple-800',
	},
	HUGGINGFACE: {
		name: 'Hugging Face',
		description: 'For EmbeddingGemma models - Free tier available',
		placeholder: 'hf_...',
		helpUrl: 'https://huggingface.co/settings/tokens',
		color: 'bg-yellow-100 text-yellow-800',
	},
};

export function ApiKeyManager() {
	const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
	const [loading, setLoading] = useState(true);
	const [showForm, setShowForm] = useState(false);
	const [formData, setFormData] = useState<ApiKeyFormData>({
		provider: 'GOOGLE',
		apiKey: '',
		keyName: '',
	});
	const [showApiKey, setShowApiKey] = useState(false);
	const [testing, setTesting] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		fetchApiKeys();
	}, []);

	const fetchApiKeys = async () => {
		try {
			const response = await fetch('/api/user/api-keys');
			const data = await response.json();

			if (data.success) {
				setApiKeys(data.data);
			} else {
				toast.error('Failed to load API keys');
			}
		} catch (_error) {
			toast.error('Failed to load API keys');
		} finally {
			setLoading(false);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSubmitting(true);

		try {
			const response = await fetch('/api/user/api-keys', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(formData),
			});

			const data = await response.json();

			if (data.success) {
				toast.success('API key saved successfully');
				setShowForm(false);
				setFormData({ provider: 'GOOGLE', apiKey: '', keyName: '' });
				fetchApiKeys();
			} else {
				toast.error(data.error || 'Failed to save API key');
			}
		} catch (_error) {
			toast.error('Failed to save API key');
		} finally {
			setSubmitting(false);
		}
	};

	const handleDelete = async (keyId: string) => {
		if (!confirm('Are you sure you want to delete this API key?')) {
			return;
		}

		try {
			const response = await fetch(`/api/user/api-keys/${keyId}`, {
				method: 'DELETE',
			});

			const data = await response.json();

			if (data.success) {
				toast.success('API key deleted successfully');
				fetchApiKeys();
			} else {
				toast.error(data.error || 'Failed to delete API key');
			}
		} catch (_error) {
			toast.error('Failed to delete API key');
		}
	};

	const handleTest = async (provider: string, apiKey: string) => {
		setTesting(provider);

		try {
			const response = await fetch('/api/user/api-keys/test', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ provider, apiKey }),
			});

			const data = await response.json();

			if (data.success) {
				toast.success(`${provider} API key is working!`);
			} else {
				toast.error(`${provider} API key test failed: ${data.error}`);
			}
		} catch (_error) {
			toast.error('Failed to test API key');
		} finally {
			setTesting(null);
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center p-8">
				<div className="h-8 w-8 animate-spin rounded-full border-blue-600 border-b-2" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="font-bold text-2xl">API Key Management</h2>
					<p className="mt-1 text-gray-600">
						Securely store your AI provider API keys for personalized access
					</p>
				</div>
				<Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
					<Plus className="h-4 w-4" />
					Add API Key
				</Button>
			</div>

			{/* Info Card */}
			<Card className="border-blue-200 bg-blue-50">
				<CardContent className="pt-6">
					<div className="flex items-start gap-3">
						<AlertCircle className="mt-0.5 h-5 w-5 text-blue-600" />
						<div>
							<h3 className="font-semibold text-blue-900">Bring Your Own Key (BYOK)</h3>
							<p className="mt-1 text-blue-800 text-sm">
								Your API keys are encrypted and stored securely. They are only used for your
								requests and never shared. We recommend starting with Google Gemini's free tier for
								testing.
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Add API Key Form */}
			{showForm && (
				<Card>
					<CardHeader>
						<CardTitle>Add New API Key</CardTitle>
						<CardDescription>Add an API key from one of the supported providers</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-4">
							<div>
								<Label htmlFor="provider">Provider</Label>
								<select
									id="provider"
									value={formData.provider}
									onChange={(e) =>
										setFormData({
											...formData,
											provider: e.target.value as any,
										})
									}
									className="mt-1 w-full rounded-md border border-gray-300 p-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
								>
									{Object.entries(PROVIDER_INFO).map(([key, info]) => (
										<option key={key} value={key}>
											{info.name} - {info.description}
										</option>
									))}
								</select>
							</div>

							<div>
								<Label htmlFor="keyName">Key Name (Optional)</Label>
								<Input
									id="keyName"
									type="text"
									placeholder="e.g., My Gemini Key"
									value={formData.keyName}
									onChange={(e) => setFormData({ ...formData, keyName: e.target.value })}
								/>
							</div>

							<div>
								<Label htmlFor="apiKey">API Key</Label>
								<div className="relative">
									<Input
										id="apiKey"
										type={showApiKey ? 'text' : 'password'}
										placeholder={PROVIDER_INFO[formData.provider].placeholder}
										value={formData.apiKey}
										onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
										required
									/>
									<button
										type="button"
										onClick={() => setShowApiKey(!showApiKey)}
										className="-translate-y-1/2 absolute top-1/2 right-3 transform text-gray-500 hover:text-gray-700"
									>
										{showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
									</button>
								</div>
								<p className="mt-1 text-gray-600 text-sm">
									Get your API key from{' '}
									<a
										href={PROVIDER_INFO[formData.provider].helpUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="text-blue-600 hover:underline"
									>
										{PROVIDER_INFO[formData.provider].name}
									</a>
								</p>
							</div>

							<div className="flex gap-3">
								<Button type="submit" disabled={submitting}>
									{submitting ? 'Saving...' : 'Save API Key'}
								</Button>
								<Button
									type="button"
									variant="outline"
									onClick={() => handleTest(formData.provider, formData.apiKey)}
									disabled={!formData.apiKey || testing === formData.provider}
								>
									{testing === formData.provider ? (
										'Testing...'
									) : (
										<>
											<TestTube className="mr-2 h-4 w-4" />
											Test Key
										</>
									)}
								</Button>
								<Button type="button" variant="outline" onClick={() => setShowForm(false)}>
									Cancel
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			)}

			{/* API Keys List */}
			<div className="space-y-4">
				<h3 className="font-semibold text-lg">Your API Keys</h3>

				{apiKeys.length === 0 ? (
					<Card>
						<CardContent className="pt-6 text-center">
							<p className="text-gray-600">No API keys configured yet.</p>
							<p className="mt-1 text-gray-500 text-sm">
								Add an API key to start using AI features with your own account.
							</p>
						</CardContent>
					</Card>
				) : (
					apiKeys.map((key) => (
						<Card key={key.id}>
							<CardContent className="pt-6">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<Badge className={PROVIDER_INFO[key.provider].color}>
											{PROVIDER_INFO[key.provider].name}
										</Badge>
										<div>
											<p className="font-medium">
												{key.keyName || `${PROVIDER_INFO[key.provider].name} Key`}
											</p>
											<p className="text-gray-600 text-sm">
												{key.maskedKey} • Added {new Date(key.createdAt).toLocaleDateString()}
												{key.lastUsed && (
													<> • Last used {new Date(key.lastUsed).toLocaleDateString()}</>
												)}
											</p>
										</div>
									</div>

									<div className="flex items-center gap-2">
										{key.isActive ? (
											<Badge variant="outline" className="border-green-600 text-green-600">
												<Check className="mr-1 h-3 w-3" />
												Active
											</Badge>
										) : (
											<Badge variant="outline" className="border-gray-600 text-gray-600">
												<X className="mr-1 h-3 w-3" />
												Inactive
											</Badge>
										)}

										<Button
											variant="outline"
											size="sm"
											onClick={() => handleDelete(key.id)}
											className="text-red-600 hover:bg-red-50 hover:text-red-700"
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					))
				)}
			</div>
		</div>
	);
}
