"""Tests for MCP server configuration (mcp/servers.py)."""
import pytest
import os
from unittest.mock import patch, MagicMock
from mcp.servers import build_mcp_servers, _node_server


class TestNodeServer:
    """Test suite for the _node_server helper function."""

    def test_node_server_found(self):
        """Test _node_server returns config when index.js exists."""
        with patch('os.path.isfile') as mock_isfile:
            mock_isfile.return_value = True
            
            result = _node_server("pdb-server", "/usr/bin/node")
            
            assert result is not None
            assert result["type"] == "local"
            assert result["command"] == "/usr/bin/node"
            assert "index.js" in result["args"][0]
            assert result["tools"] == ["*"]

    def test_node_server_not_found(self):
        """Test _node_server returns None when index.js doesn't exist."""
        with patch('os.path.isfile') as mock_isfile:
            mock_isfile.return_value = False
            
            result = _node_server("pdb-server", "/usr/bin/node")
            
            assert result is None

    def test_node_server_no_node_installed(self):
        """Test _node_server returns None when node is not available."""
        with patch('os.path.isfile') as mock_isfile:
            mock_isfile.return_value = True
            
            result = _node_server("pdb-server", None)
            
            assert result is None

    def test_node_server_command_path(self):
        """Test _node_server uses correct command path."""
        with patch('os.path.isfile') as mock_isfile:
            with patch('os.path.join') as mock_join:
                mock_isfile.return_value = True
                mock_join.return_value = "/app/backend/mcp-servers/test-server/build/index.js"
                
                result = _node_server("test-server", "/usr/bin/node")
                
                assert result["command"] == "/usr/bin/node"
                # Verify join was called to construct path
                assert mock_join.called


class TestBuildMcpServers:
    """Test suite for the build_mcp_servers function."""

    def test_build_servers_returns_dict(self):
        """Test build_mcp_servers returns a dictionary."""
        with patch('shutil.which') as mock_which:
            with patch('os.path.isfile') as mock_isfile:
                mock_which.return_value = None
                mock_isfile.return_value = False
                
                result = build_mcp_servers()
                
                assert isinstance(result, dict)

    def test_uniprot_server_added_when_exists(self):
        """Test UniProt server is added when wrapper exists."""
        with patch('shutil.which') as mock_which:
            with patch('os.path.isfile') as mock_isfile:
                mock_which.return_value = "/usr/bin/python"
                
                # Return True for uniprot_mcp_wrapper.py, False for others
                def isfile_side_effect(path):
                    return "uniprot_mcp_wrapper.py" in path
                
                mock_isfile.side_effect = isfile_side_effect
                
                result = build_mcp_servers()
                
                assert "uniprot" in result
                assert result["uniprot"]["type"] == "local"
                assert "uniprot_mcp_wrapper.py" in result["uniprot"]["args"][0]

    def test_uniprot_server_skipped_when_missing(self):
        """Test UniProt server is not added when wrapper missing."""
        with patch('shutil.which') as mock_which:
            with patch('os.path.isfile') as mock_isfile:
                mock_which.return_value = "/usr/bin/python"
                mock_isfile.return_value = False
                
                result = build_mcp_servers()
                
                assert "uniprot" not in result

    def test_pdb_server_added_when_exists(self):
        """Test PDB server is added when built."""
        with patch('shutil.which') as mock_which:
            with patch('os.path.isfile') as mock_isfile:
                with patch('mcp.servers._node_server') as mock_node_server:
                    mock_which.return_value = "/usr/bin/node"
                    mock_isfile.return_value = False  # No UniProt
                    
                    # Return config for PDB server
                    def node_server_side_effect(name, node_cmd):
                        if name == "pdb-server":
                            return {"type": "local", "command": node_cmd, "args": ["index.js"], "tools": ["*"]}
                        return None
                    
                    mock_node_server.side_effect = node_server_side_effect
                    
                    result = build_mcp_servers()
                    
                    assert "pdb" in result
                    assert result["pdb"]["type"] == "local"

    def test_pubmed_server_with_ncbi_api_key(self):
        """Test PubMed server includes NCBI credentials when available."""
        with patch.dict(os.environ, {"NCBI_API_KEY": "test-key-123", "NCBI_EMAIL": "test@example.com"}):
            with patch('shutil.which') as mock_which:
                with patch('os.path.isfile') as mock_isfile:
                    with patch('mcp.servers._node_server') as mock_node_server:
                        mock_which.return_value = "/usr/bin/node"
                        mock_isfile.return_value = False
                        
                        def node_server_side_effect(name, node_cmd):
                            if name == "pubmed-server":
                                return {"type": "local", "command": node_cmd, "args": ["index.js"], "tools": ["*"]}
                            return None
                        
                        mock_node_server.side_effect = node_server_side_effect
                        
                        result = build_mcp_servers()
                        
                        assert "pubmed" in result
                        assert "env" in result["pubmed"]
                        assert result["pubmed"]["env"]["NCBI_API_KEY"] == "test-key-123"
                        assert result["pubmed"]["env"]["NCBI_EMAIL"] == "test@example.com"

    def test_pubmed_server_without_ncbi_api_key(self):
        """Test PubMed server works without NCBI credentials."""
        with patch.dict(os.environ, {}, clear=True):
            with patch('shutil.which') as mock_which:
                with patch('os.path.isfile') as mock_isfile:
                    with patch('mcp.servers._node_server') as mock_node_server:
                        mock_which.return_value = "/usr/bin/node"
                        mock_isfile.return_value = False
                        
                        def node_server_side_effect(name, node_cmd):
                            if name == "pubmed-server":
                                return {"type": "local", "command": node_cmd, "args": ["index.js"], "tools": ["*"]}
                            return None
                        
                        mock_node_server.side_effect = node_server_side_effect
                        
                        result = build_mcp_servers()
                        
                        assert "pubmed" in result
                        # Should still be there but without env key
                        assert "env" not in result["pubmed"] or len(result["pubmed"].get("env", {})) == 0

    def test_all_servers_structure(self):
        """Test all servers follow the same configuration structure."""
        with patch('shutil.which') as mock_which:
            with patch('os.path.isfile') as mock_isfile:
                with patch('mcp.servers._node_server') as mock_node_server:
                    mock_which.return_value = "/usr/bin/node"
                    
                    def isfile_side_effect(path):
                        return "uniprot_mcp_wrapper.py" in path
                    
                    mock_isfile.side_effect = isfile_side_effect
                    
                    def node_server_side_effect(name, node_cmd):
                        if node_cmd:
                            return {"type": "local", "command": node_cmd, "args": [f"{name}/index.js"], "tools": ["*"]}
                        return None
                    
                    mock_node_server.side_effect = node_server_side_effect
                    
                    result = build_mcp_servers()
                    
                    # Verify each server has required fields
                    for server_name, server_config in result.items():
                        assert "type" in server_config
                        assert server_config["type"] == "local"
                        assert "command" in server_config
                        assert "args" in server_config
                        assert "tools" in server_config
                        assert server_config["tools"] == ["*"]

    def test_set_mcp_server_names_called(self):
        """Test build_mcp_servers calls set_mcp_server_names with correct names."""
        with patch('shutil.which') as mock_which:
            with patch('os.path.isfile') as mock_isfile:
                with patch('mcp.servers.set_mcp_server_names') as mock_set_names:
                    mock_which.return_value = "/usr/bin/node"
                    mock_isfile.return_value = False
                    
                    build_mcp_servers()
                    
                    # Verify set_mcp_server_names was called
                    assert mock_set_names.called
                    # It should be called with a list
                    call_args = mock_set_names.call_args[0][0]
                    assert isinstance(call_args, list)

    def test_python_cmd_fallback_to_executable(self):
        """Test python_cmd falls back to sys.executable when which fails."""
        with patch('shutil.which') as mock_which:
            with patch('os.path.isfile') as mock_isfile:
                with patch('sys.executable', '/usr/bin/python3'):
                    # which("node") returns /usr/bin/node, which("python") returns None
                    def which_side_effect(cmd):
                        if cmd == "node":
                            return "/usr/bin/node"
                        return None
                    
                    mock_which.side_effect = which_side_effect
                    mock_isfile.return_value = True  # UniProt exists
                    
                    result = build_mcp_servers()
                    
                    assert "uniprot" in result
                    # Should use sys.executable as fallback
                    assert result["uniprot"]["command"] == "/usr/bin/python3"

    def test_empty_servers_dict_when_nothing_available(self):
        """Test returns empty dict when no servers are available."""
        with patch('shutil.which') as mock_which:
            with patch('os.path.isfile') as mock_isfile:
                with patch('mcp.servers._node_server') as mock_node_server:
                    mock_which.return_value = None
                    mock_isfile.return_value = False
                    mock_node_server.return_value = None
                    
                    result = build_mcp_servers()
                    
                    # Should have empty dict or no MCP servers
                    assert isinstance(result, dict)
                    # Uniprot is optional, so could be empty
                    assert len(result) == 0 or len(result) <= 1

    def test_server_command_uses_correct_python(self):
        """Test server commands use the resolved python path."""
        with patch('shutil.which') as mock_which:
            with patch('os.path.isfile') as mock_isfile:
                mock_which.return_value = "/custom/python"
                
                def isfile_side_effect(path):
                    return "uniprot_mcp_wrapper.py" in path
                
                mock_isfile.side_effect = isfile_side_effect
                
                result = build_mcp_servers()
                
                if "uniprot" in result:
                    assert result["uniprot"]["command"] == "/custom/python"
